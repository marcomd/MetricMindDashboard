import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all repositories
router.get('/repos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.name,
        r.description,
        COUNT(c.id) as total_commits,
        MAX(c.commit_date) as latest_commit,
        COUNT(DISTINCT c.author_email) as unique_authors
      FROM repositories r
      LEFT JOIN commits c ON r.id = c.repository_id
      GROUP BY r.id, r.name, r.description
      ORDER BY r.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching repositories:', err);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Get monthly trends for all repositories (global)
router.get('/monthly-trends', async (req, res) => {
  try {
    const limit = req.query.limit || 12;
    const result = await pool.query(`
      SELECT
        year_month,
        month_start_date,
        SUM(total_commits)::int as total_commits,
        SUM(total_lines_added)::bigint as total_lines_added,
        SUM(total_lines_deleted)::bigint as total_lines_deleted,
        SUM(total_lines_changed)::bigint as total_lines_changed,
        COUNT(DISTINCT repository_name) as active_repositories,
        SUM(unique_authors)::int as total_authors,
        ROUND(AVG(avg_lines_changed_per_commit)::numeric, 1) as avg_lines_changed_per_commit
      FROM mv_monthly_stats_by_repo
      GROUP BY year_month, month_start_date
      ORDER BY month_start_date DESC
      LIMIT $1
    `, [limit]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching global monthly trends:', err);
    res.status(500).json({ error: 'Failed to fetch global monthly trends' });
  }
});

// Get monthly trends for a specific repository
router.get('/monthly-trends/:repoName', async (req, res) => {
  try {
    const { repoName } = req.params;
    const limit = req.query.limit || 12;
    const result = await pool.query(`
      SELECT
        year_month,
        month_start_date,
        total_commits,
        total_lines_added,
        total_lines_deleted,
        total_lines_changed,
        unique_authors,
        avg_lines_changed_per_commit,
        avg_commits_per_author
      FROM mv_monthly_stats_by_repo
      WHERE repository_name = $1
      ORDER BY month_start_date DESC
      LIMIT $2
    `, [repoName, limit]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching monthly trends:', err);
    res.status(500).json({ error: 'Failed to fetch monthly trends' });
  }
});

// Get top contributors across all repositories
router.get('/contributors', async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const repo = req.query.repo;
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;

    // Check if we need to use custom query (only when actual filters are applied beyond defaults)
    const hasRepoFilter = repo && repo !== 'all';
    const hasDateFilter = dateFrom || dateTo;

    if (hasRepoFilter || hasDateFilter) {
      let query = `
        WITH normalized_commits AS (
          SELECT
            c.*,
            LOWER(TRIM(c.author_name)) as normalized_name,
            LOWER(TRIM(c.author_email)) as normalized_email
          FROM commits c
      `;

      const conditions = [];
      const params = [];
      let paramIndex = 1;

      if (hasRepoFilter) {
        query += `
          JOIN repositories r ON c.repository_id = r.id
        `;
        conditions.push(`r.name = $${paramIndex}`);
        params.push(repo);
        paramIndex++;
      }

      if (dateFrom) {
        conditions.push(`c.commit_date >= $${paramIndex}`);
        params.push(dateFrom);
        paramIndex++;
      }

      if (dateTo) {
        conditions.push(`c.commit_date <= $${paramIndex}`);
        params.push(dateTo);
        paramIndex++;
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += `
        )
        SELECT
          MAX(author_name) as author_name,
          MAX(author_email) as author_email,
          COUNT(id)::int as total_commits,
          COUNT(DISTINCT repository_id)::int as repositories_contributed,
          SUM(lines_added + lines_deleted)::bigint as total_lines_changed,
          ROUND(AVG(lines_added + lines_deleted)::numeric, 1) as avg_lines_changed_per_commit
        FROM normalized_commits
        GROUP BY normalized_name
        ORDER BY total_commits DESC
        LIMIT $${paramIndex}
      `;
      params.push(limit);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } else {
      // Use the materialized view for faster queries when no filters
      const result = await pool.query(`
        SELECT
          author_name,
          author_email,
          total_commits,
          repositories_contributed,
          total_lines_changed,
          avg_lines_changed_per_commit
        FROM v_contributor_stats
        ORDER BY total_commits DESC
        LIMIT $1
      `, [limit]);
      res.json(result.rows);
    }
  } catch (err) {
    console.error('Error fetching contributors:', err);
    res.status(500).json({ error: 'Failed to fetch contributors' });
  }
});

// Get date range for contributors (min and max commit dates)
router.get('/contributors/date-range', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        MIN(commit_date) as min_date,
        MAX(commit_date) as max_date
      FROM commits
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching date range:', err);
    res.status(500).json({ error: 'Failed to fetch date range' });
  }
});

// Get daily activity for last N days
router.get('/daily-activity', async (req, res) => {
  try {
    const days = req.query.days || 30;
    const result = await pool.query(`
      SELECT
        commit_date,
        repository_name,
        total_commits,
        total_lines_changed,
        unique_authors
      FROM v_daily_stats_by_repo
      WHERE commit_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY commit_date DESC, repository_name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching daily activity:', err);
    res.status(500).json({ error: 'Failed to fetch daily activity' });
  }
});

// Compare repositories
router.get('/compare-repos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        repository_name,
        SUM(total_commits)::int as total_commits,
        SUM(total_lines_changed)::bigint as total_lines_changed,
        COUNT(DISTINCT year_month) as months_active,
        ROUND(AVG(unique_authors)::numeric, 1) as avg_authors_per_month,
        ROUND(AVG(avg_lines_changed_per_commit)::numeric, 1) as avg_lines_per_commit
      FROM mv_monthly_stats_by_repo
      WHERE month_start_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY repository_name
      ORDER BY total_commits DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error comparing repositories:', err);
    res.status(500).json({ error: 'Failed to compare repositories' });
  }
});

// Before/After analysis for a repository
router.get('/before-after/:repoName', async (req, res) => {
  try {
    const { repoName } = req.params;
    const { beforeStart, beforeEnd, afterStart, afterEnd } = req.query;

    const beforeResult = await pool.query(`
      SELECT
        AVG(avg_lines_changed_per_commit)::numeric as avg_lines_per_commit,
        AVG(total_commits)::numeric as avg_commits_per_month,
        AVG(unique_authors)::numeric as avg_authors
      FROM mv_monthly_stats_by_repo
      WHERE repository_name = $1
        AND month_start_date BETWEEN $2 AND $3
    `, [repoName, beforeStart, beforeEnd]);

    const afterResult = await pool.query(`
      SELECT
        AVG(avg_lines_changed_per_commit)::numeric as avg_lines_per_commit,
        AVG(total_commits)::numeric as avg_commits_per_month,
        AVG(unique_authors)::numeric as avg_authors
      FROM mv_monthly_stats_by_repo
      WHERE repository_name = $1
        AND month_start_date BETWEEN $2 AND $3
    `, [repoName, afterStart, afterEnd]);

    res.json({
      before: beforeResult.rows[0],
      after: afterResult.rows[0]
    });
  } catch (err) {
    console.error('Error in before/after analysis:', err);
    res.status(500).json({ error: 'Failed to perform before/after analysis' });
  }
});

export default router;
