import { buildCellCards, getCellTermIds } from '../utils/cellPrecision.js';

/**
 * Cell precision competency queries (31 to 40).
 * See the flatmap server's "Cell Precision Competency Queries" documentation.
 *
 * All queries are POST {endpoint}/competency/query with
 * { query_id, parameters: [{ column, value }] }
 * and return { query_id, results: { keys: [...], values: [[...], ...] } }.
 * Every result has `source_id` (the requested map UUID or SCKAN release) and
 * `sckan_id` (its SCKAN release).
 */

const CELL_PATHS_QUERY = 37;
const TERMS_QUERY = 39;
const CELLS_QUERY = 40;

const cellCardsCache = new Map();

function getQueryUrl(endpoint) {
  const base = String(endpoint || '').trim();
  if (!base) return '';
  return `${base.replace(/\/+$/, '')}/competency/query`;
}

/**
 * Run a cell precision competency query.
 * `source_id` is left out when `sourceId` is empty, so the server uses the latest SCKAN release.
 * @returns {Promise<Array<Object>>} rows as objects keyed by column name
 */
async function queryCellPrecision(endpoint, sourceId, queryId, parameters = []) {
  const url = getQueryUrl(endpoint);
  if (!url) {
    throw new Error('Cell precision API endpoint is not configured.');
  }

  const params = [...parameters];
  if (sourceId) {
    params.push({ column: 'source_id', value: sourceId });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query_id: String(queryId), parameters: params }),
  });

  if (!response.ok) {
    throw new Error(`Cell precision query ${queryId} failed: ${response.status}`);
  }

  const data = await response.json();
  const keys = data?.results?.keys || [];
  const values = data?.results?.values || [];
  return values.map((row) => Object.fromEntries(keys.map((key, index) => [key, row[index]])));
}

/**
 * Labels and synonyms of terms (query 39).
 * Optional: the cards are still built from the query 40 labels if this fails.
 */
async function fetchTerms(endpoint, sourceId, termIds) {
  if (!termIds.length) return [];
  try {
    return await queryCellPrecision(endpoint, sourceId, TERMS_QUERY, [
      { column: 'term_id', value: termIds },
    ]);
  } catch (error) {
    console.warn('Cell precision term labels and synonyms are not available:', error);
    return [];
  }
}

/**
 * Fetch every cell precision (for the map or SCKAN release given by `sourceId`)
 * with query 40, the labels and synonyms of their terms with query 39, and
 * convert them to the card objects used by CellCard.vue.
 * Results are cached per endpoint and source.
 */
function fetchCellCards(endpoint, sourceId) {
  const cacheKey = `${endpoint}|${sourceId || ''}`;

  if (!cellCardsCache.has(cacheKey)) {
    const request = queryCellPrecision(endpoint, sourceId, CELLS_QUERY)
      .then(async (cells) => {
        const terms = await fetchTerms(endpoint, sourceId, getCellTermIds(cells));
        return buildCellCards({ cells, terms });
      })
      .catch((error) => {
        // Do not cache failures, so the next mount can retry.
        cellCardsCache.delete(cacheKey);
        throw error;
      });

    cellCardsCache.set(cacheKey, request);
  }

  return cellCardsCache.get(cacheKey);
}

/**
 * Neuron populations (path ids) that share at least one node with a cell precision (query 37).
 * @returns {Promise<{pathIds: string[], nodeIds: string[]}>}
 */
async function fetchCellPaths(endpoint, sourceId, cellId) {
  const cellIds = Array.isArray(cellId) ? cellId : [cellId];
  const rows = await queryCellPrecision(endpoint, sourceId, CELL_PATHS_QUERY, [
    { column: 'cell_id', value: cellIds },
  ]);

  return {
    pathIds: [...new Set(rows.map((row) => row.path_id).filter(Boolean))],
    nodeIds: [...new Set(rows.map((row) => row.node_id).filter(Boolean))],
  };
}

export { queryCellPrecision, fetchCellCards, fetchCellPaths };
