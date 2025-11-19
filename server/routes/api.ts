import express, { Request, Response } from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all repositories
router.get('/repos', async (req: Request, res: Response) => {
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
router.get('/monthly-trends', async (req: Request, res: Response) => {
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
router.get('/monthly-trends/:repoName', async (req: Request, res: Response) => {
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
router.get('/contributors', async (req: Request, res: Response) => {
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

      const conditions: string[] = [];
      const params: any[] = [];
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
router.get('/contributors/date-range', async (req: Request, res: Response) => {
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
router.get('/daily-activity', async (req: Request, res: Response) => {
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
router.get('/compare-repos', async (req: Request, res: Response) => {
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

// Before/After analysis for a repository or all repositories
router.get('/before-after/:repoName', async (req: Request, res: Response) => {
  try {
    const { repoName } = req.params;
    const { beforeStart, beforeEnd, afterStart, afterEnd } = req.query;

    // Different queries for 'all' repositories vs specific repository
    const isAllRepos = repoName === 'all';

    let beforeResult, afterResult;

    if (isAllRepos) {
      // Aggregate across all repositories
      beforeResult = await pool.query(`
        SELECT
          AVG(avg_lines_changed_per_commit)::numeric as avg_lines_per_commit,
          AVG(total_commits)::numeric as avg_commits_per_month,
          AVG(unique_authors)::numeric as avg_authors,
          AVG(avg_commits_per_author)::numeric as avg_commits_per_committer
        FROM mv_monthly_stats_by_repo
        WHERE month_start_date BETWEEN $1 AND $2
      `, [beforeStart, beforeEnd]);

      afterResult = await pool.query(`
        SELECT
          AVG(avg_lines_changed_per_commit)::numeric as avg_lines_per_commit,
          AVG(total_commits)::numeric as avg_commits_per_month,
          AVG(unique_authors)::numeric as avg_authors,
          AVG(avg_commits_per_author)::numeric as avg_commits_per_committer
        FROM mv_monthly_stats_by_repo
        WHERE month_start_date BETWEEN $1 AND $2
      `, [afterStart, afterEnd]);
    } else {
      // Filter by specific repository
      beforeResult = await pool.query(`
        SELECT
          AVG(avg_lines_changed_per_commit)::numeric as avg_lines_per_commit,
          AVG(total_commits)::numeric as avg_commits_per_month,
          AVG(unique_authors)::numeric as avg_authors,
          AVG(avg_commits_per_author)::numeric as avg_commits_per_committer
        FROM mv_monthly_stats_by_repo
        WHERE repository_name = $1
          AND month_start_date BETWEEN $2 AND $3
      `, [repoName, beforeStart, beforeEnd]);

      afterResult = await pool.query(`
        SELECT
          AVG(avg_lines_changed_per_commit)::numeric as avg_lines_per_commit,
          AVG(total_commits)::numeric as avg_commits_per_month,
          AVG(unique_authors)::numeric as avg_authors,
          AVG(avg_commits_per_author)::numeric as avg_commits_per_committer
        FROM mv_monthly_stats_by_repo
        WHERE repository_name = $1
          AND month_start_date BETWEEN $2 AND $3
      `, [repoName, afterStart, afterEnd]);
    }

    res.json({
      before: beforeResult.rows[0],
      after: afterResult.rows[0]
    });
  } catch (err) {
    console.error('Error in before/after analysis:', err);
    res.status(500).json({ error: 'Failed to perform before/after analysis' });
  }
});

// Get category statistics with optional filters
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const repo = req.query.repo;
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;

    const hasRepoFilter = repo && repo !== 'all';
    const hasDateFilter = dateFrom || dateTo;

    if (hasRepoFilter || hasDateFilter) {
      // Custom query with filters
      let query = `
        SELECT
          COALESCE(c.category, 'UNCATEGORIZED') as category,
          COUNT(c.id)::int as total_commits,
          SUM(c.lines_added + c.lines_deleted)::bigint as total_lines_changed,
          COUNT(DISTINCT c.author_email)::int as unique_authors,
          COUNT(DISTINCT c.repository_id)::int as repositories
        FROM commits c
      `;

      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (hasRepoFilter) {
        query += ` JOIN repositories r ON c.repository_id = r.id `;
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
        GROUP BY c.category
        ORDER BY total_commits DESC
      `;

      const result = await pool.query(query, params);
      res.json(result.rows);
    } else {
      // Use view for unfiltered queries
      const result = await pool.query(`
        SELECT
          category,
          total_commits,
          total_lines_changed,
          unique_authors,
          repositories
        FROM v_category_stats
        ORDER BY total_commits DESC
      `);
      res.json(result.rows);
    }
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get monthly category trends for stacked area chart
router.get('/category-trends', async (req: Request, res: Response) => {
  try {
    const months = req.query.months || 12;
    const repo = req.query.repo;
    const hasRepoFilter = repo && repo !== 'all';

    if (hasRepoFilter) {
      // Filter by repository
      const result = await pool.query(`
        SELECT
          mcs.year_month,
          mcs.month_start_date,
          COALESCE(mcs.category, 'UNCATEGORIZED') as category,
          mcs.total_commits,
          mcs.total_lines_changed,
          mcs.unique_authors
        FROM mv_monthly_category_stats mcs
        WHERE mcs.repository_name = $1
        ORDER BY mcs.month_start_date DESC, mcs.category
        LIMIT $2
      `, [repo, Number(months) * 20]); // Multiply by estimated categories
      res.json(result.rows);
    } else {
      // All repositories
      const result = await pool.query(`
        SELECT
          year_month,
          month_start_date,
          COALESCE(category, 'UNCATEGORIZED') as category,
          SUM(total_commits)::int as total_commits,
          SUM(total_lines_changed)::bigint as total_lines_changed,
          SUM(unique_authors)::int as unique_authors
        FROM mv_monthly_category_stats
        GROUP BY year_month, month_start_date, category
        ORDER BY month_start_date DESC, category
        LIMIT $1
      `, [Number(months) * 20]); // Multiply by estimated categories
      res.json(result.rows);
    }
  } catch (err) {
    console.error('Error fetching category trends:', err);
    res.status(500).json({ error: 'Failed to fetch category trends' });
  }
});

// Get category distribution across repositories
router.get('/category-by-repo', async (req: Request, res: Response) => {
  try {
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;
    const hasDateFilter = dateFrom || dateTo;

    if (hasDateFilter) {
      // Custom query with date filters
      let query = `
        SELECT
          r.name as repository,
          COALESCE(c.category, 'UNCATEGORIZED') as category,
          COUNT(c.id)::int as total_commits,
          SUM(c.lines_added + c.lines_deleted)::bigint as total_lines_changed
        FROM commits c
        JOIN repositories r ON c.repository_id = r.id
      `;

      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

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
        GROUP BY r.name, c.category
        ORDER BY r.name, total_commits DESC
      `;

      const result = await pool.query(query, params);
      res.json(result.rows);
    } else {
      // Use view for unfiltered queries
      const result = await pool.query(`
        SELECT
          repository,
          category,
          total_commits,
          total_lines_changed
        FROM v_category_by_repo
        ORDER BY repository, total_commits DESC
      `);
      res.json(result.rows);
    }
  } catch (err) {
    console.error('Error fetching category by repository:', err);
    res.status(500).json({ error: 'Failed to fetch category by repository' });
  }
});

// Get top commits for a specific month
router.get('/monthly-commits/:year_month', async (req: Request, res: Response) => {
  try {
    const { year_month } = req.params;
    const repo = req.query.repo as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    // Validate year_month format (YYYY-MM)
    const yearMonthRegex = /^\d{4}-\d{2}$/;
    if (!yearMonthRegex.test(year_month)) {
      return res.status(400).json({ error: 'Invalid year_month format. Expected YYYY-MM' });
    }

    // Extract year and month
    const [year, month] = year_month.split('-');
    const monthNum = parseInt(month);

    // Validate month is between 01-12
    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid month. Must be between 01 and 12' });
    }

    // Calculate start and end dates for the month
    const startDate = `${year}-${month}-01`;
    const lastDay = new Date(parseInt(year), monthNum, 0).getDate(); // Get last day of month
    const endDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;

    // Build query
    const hasRepoFilter = repo && repo !== 'all';
    let query = `
      SELECT
        c.commit_date,
        c.hash as commit_hash,
        c.subject as commit_message,
        c.author_name,
        ${hasRepoFilter ? 'r.name' : '(SELECT name FROM repositories WHERE id = c.repository_id)'} as repository_name,
        (c.lines_added + c.lines_deleted) as lines_changed,
        c.lines_added,
        c.lines_deleted
      FROM commits c
    `;

    const conditions: string[] = [`c.commit_date >= $1`, `c.commit_date <= $2`];
    const params: any[] = [startDate, endDate];
    let paramIndex = 3;

    if (hasRepoFilter) {
      query += ` JOIN repositories r ON c.repository_id = r.id `;
      conditions.push(`r.name = $${paramIndex}`);
      params.push(repo);
      paramIndex++;
    }

    query += ' WHERE ' + conditions.join(' AND ');
    query += `
      ORDER BY lines_changed DESC
      LIMIT $${paramIndex}
    `;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching monthly commits:', err);
    res.status(500).json({ error: 'Failed to fetch monthly commits' });
  }
});

// Get summary report with overall stats, largest commits, and top contributors
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const repo = req.query.repo;
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;

    const hasRepoFilter = repo && repo !== 'all';
    const hasDateFilter = dateFrom || dateTo;

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    let baseQuery = 'FROM commits c';

    if (hasRepoFilter) {
      baseQuery += ' JOIN repositories r ON c.repository_id = r.id';
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

    const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

    // 1. Overall Statistics
    const statsQuery = `
      SELECT
        COUNT(c.id)::int as total_commits,
        COALESCE(SUM(c.lines_added), 0)::bigint as total_lines_added,
        COALESCE(SUM(c.lines_deleted), 0)::bigint as total_lines_deleted,
        COALESCE(SUM(c.lines_added + c.lines_deleted), 0)::bigint as total_lines_changed,
        COALESCE(ROUND(AVG(c.lines_added + c.lines_deleted)::numeric, 1), 0) as avg_lines_changed_per_commit,
        COALESCE(ROUND(AVG(c.lines_added)::numeric, 1), 0) as avg_lines_added_per_commit,
        COALESCE(ROUND(AVG(c.lines_deleted)::numeric, 1), 0) as avg_lines_deleted_per_commit
      ${baseQuery}
      ${whereClause}
    `;

    // 2. Top 10 Largest Commits
    const largestCommitsQuery = `
      SELECT
        c.commit_date,
        c.hash as commit_hash,
        c.subject as commit_message,
        c.author_name,
        ${hasRepoFilter ? 'r.name' : '(SELECT name FROM repositories WHERE id = c.repository_id)'} as repository_name,
        (c.lines_added + c.lines_deleted) as lines_changed,
        c.lines_added,
        c.lines_deleted
      ${baseQuery}
      ${whereClause}
      ORDER BY lines_changed DESC
      LIMIT 10
    `;

    // 3. Top 10 Contributors
    const topContributorsQuery = `
      WITH normalized_commits AS (
        SELECT
          c.*,
          LOWER(TRIM(c.author_name)) as normalized_name,
          LOWER(TRIM(c.author_email)) as normalized_email
        ${baseQuery}
        ${whereClause}
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
      LIMIT 10
    `;

    // Execute all queries
    const [statsResult, largestCommitsResult, topContributorsResult] = await Promise.all([
      pool.query(statsQuery, params),
      pool.query(largestCommitsQuery, params),
      pool.query(topContributorsQuery, params)
    ]);

    res.json({
      overall_stats: statsResult.rows[0],
      largest_commits: largestCommitsResult.rows,
      top_contributors: topContributorsResult.rows
    });
  } catch (err) {
    console.error('Error fetching summary:', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

export default router;
