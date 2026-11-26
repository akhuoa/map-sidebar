/**
 * Converts the cell precision competency queries into the card objects
 * used by CellCard.vue and CellCardExplorer.vue:
 * - query 40: one row per cell precision with its properties (as query 33),
 *   descriptive attributes (as query 34) and nodes (as query 35)
 * - query 39: labels and synonyms of the terms used by the cells (optional)
 */

// Display names and chip colours of the source publications, keyed by DOI.
// The API returns the publication link (`reference`) but no short name for it.
const SOURCE_PUBLICATIONS = {
  '10.1126/sciadv.adj9173': { label: 'CSA paper', color: '#667eea' },
  '10.1101/2025.11.05.686654': { label: 'big DRG paper', color: '#f59e0b' },
  '10.1126/scitranslmed.abj8186': { label: 'Tavares-Ferreira et al., 2022', color: '#22c55e' },
  '10.1038/s41593-024-01794-1': { label: 'Yu et al., 2024', color: '#ef4444' },
  '10.1038/s42003-025-08315-1': { label: 'Krauter et al., 2025', color: '#8b5cf6' },
  '10.1016/j.cell.2024.02.006': { label: 'Qi et al., 2024', color: '#06b6d4' },
  '10.1038/s41467-021-21725-z': { label: 'Kupari et al., 2021', color: '#ec4899' },
};

// Common names used for the species facet. Other taxa use their query 39 label.
const TAXON_NAMES = {
  'NCBITaxon:9606': 'human',
  'NCBITaxon:10090': 'mouse',
  'NCBITaxon:10116': 'rat',
  'NCBITaxon:9544': 'macaque',
  'NCBITaxon:10141': 'guinea pig',
  'NCBITaxon:9823': 'pig',
};

const DEFAULT_SOURCE_COLOR = '#8300bf';

// Synonyms shorter than this (e.g. "m", "h" for mouse and human) are not searched.
const MIN_SYNONYM_LENGTH = 3;

const ATTRIBUTE_TYPES = {
  GENE: 'ilxtr:hasNucleicAcidExpressionPhenotype',
  EXPRESSION: 'ilxtr:hasExpressionPhenotype',
  AXON: 'ilxtr:hasAxonPhenotype',
  SENSORY_STRUCTURE: 'ilxtr:hasAxonSensorySubcellularStructure',
  THRESHOLD: 'ilxtr:hasThresholdPhenotype',
  ADAPTATION: 'ilxtr:hasAdaptationPhenotype',
  FUNCTIONAL: 'ilxtr:hasFunctionalPhenotype',
  NEUROTRANSMITTER: 'ilxtr:hasNeurotransmitterPhenotype',
  CIRCUIT: 'ilxtr:isMemberOfCircuit',
  DRIVER: 'ilxtr:hasDriverExpressionConstitutivePhenotype',
};

const LOCATION_TYPES = {
  SOMA: 'ilxtr:hasSomaLocatedIn',
  SENSORY_TERMINAL: 'ilxtr:hasAxonSensorySubcellularElementIn',
  PRESYNAPTIC_TERMINAL: 'ilxtr:hasAxonPresynapticElementIn',
};

const EXPRESSION_LEVELS = {
  'ilxtr:HigherExpression': 'high',
  'ilxtr:LowerExpression': 'low',
};

const PHYSIOLOGY_TYPES = [
  ATTRIBUTE_TYPES.THRESHOLD,
  ATTRIBUTE_TYPES.ADAPTATION,
  ATTRIBUTE_TYPES.FUNCTIONAL,
];

const isMissingValue = (id) => String(id || '').startsWith('TEMP:MISSING');

const unique = (items) => [...new Set(items.filter(Boolean))];

const asList = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const HTML_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/**
 * Some labels and synonyms contain HTML entities, e.g. "Meissner&#39;s corpuscle".
 */
function decodeEntities(text) {
  return String(text || '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (code[0] === '#') {
      const value =
        code[1] === 'x' || code[1] === 'X'
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : entity;
    }
    return HTML_ENTITIES[code.toLowerCase()] ?? entity;
  });
}

const cleanText = (text) => decodeEntities(text).replace(/\s+/g, ' ').trim();

/**
 * Split "DRG CGRP-zeta (Qi2024)" into { name: 'DRG CGRP-zeta', citationKey: 'Qi2024' }.
 */
function parseCellLabel(label) {
  const text = cleanText(label);
  const match = text.match(/^(.*?)\s*\(([^()]*)\)$/);
  return {
    name: match ? match[1].trim() : text,
    citationKey: match ? match[2].trim() : '',
  };
}

/**
 * Alerts come back as a Postgres array literal, e.g. '{"note one","note two"}'.
 */
function parseAlert(alert) {
  if (!alert) return [];
  if (Array.isArray(alert)) return alert.filter(Boolean);

  const text = String(alert).trim();
  if (text.startsWith('{') && text.endsWith('}')) {
    const inner = text.slice(1, -1);
    const notes = [];
    const pattern = /"((?:[^"\\]|\\.)*)"|([^,]+)/g;
    let match;
    while ((match = pattern.exec(inner)) !== null) {
      const note = (match[1] !== undefined ? match[1].replace(/\\(.)/g, '$1') : match[2]).trim();
      if (note) notes.push(note);
    }
    return notes;
  }

  return [text];
}

function removePhenotypeSuffix(label) {
  return String(label || '')
    .replace(/\s+phenotype$/i, '')
    .trim();
}

function getGeneUri(featureId) {
  const id = String(featureId || '');
  if (id.startsWith('NCBIGene:')) {
    return `https://www.ncbi.nlm.nih.gov/gene/${id.split(':')[1]}`;
  }
  return '';
}

/**
 * "https://www.biorxiv.org/content/10.1101/2025.11.05.686654v1" -> "10.1101/2025.11.05.686654"
 */
function getDoi(uri) {
  const match = String(uri || '').match(/(10\.\d{4,9}\/[^\s?#]+)/);
  return match ? match[1].replace(/v\d+$/, '').replace(/[.,;]+$/, '') : '';
}

function getSourcePublication(references, citationKey) {
  const uri = asList(references)[0] || '';
  const publication = SOURCE_PUBLICATIONS[getDoi(uri)];
  return {
    uri,
    label: publication?.label || citationKey || uri,
    color: publication?.color || DEFAULT_SOURCE_COLOR,
  };
}

/**
 * Dataset links (SCKAN ilxtr:dataCitation), labelled with a GEO accession when there is one.
 */
function getSourceData(datasetIds) {
  return asList(datasetIds).map((uri) => {
    const accession = String(uri).match(/[?&]acc=([^&#]+)/i);
    const doi = getDoi(uri);
    return { uri, label: accession ? accession[1] : doi || uri };
  });
}

/**
 * Labels and synonyms of terms (query 39 rows), keyed by term id.
 */
function buildTermLookup(termRows) {
  const terms = new Map();
  asList(termRows).forEach((row) => {
    if (!row?.term_id) return;
    terms.set(row.term_id, {
      label: cleanText(row.label),
      synonyms: unique(asList(row.synonym).map(cleanText)),
    });
  });
  return terms;
}

/**
 * The query 39 label when it is a real label, otherwise the label returned with the cell.
 * Some terms only have their id as label, e.g. "JAX:021077".
 */
function getTermLabel(terms, featureId, featureLabel) {
  const termLabel = terms.get(featureId)?.label;
  if (termLabel && termLabel !== featureId) return termLabel;
  return cleanText(featureLabel || featureId);
}

/**
 * Query 40 lists:
 *   descriptive_attribute: [type_id, combination_id, feature_id, feature_label]
 *   node:                  [type_id, node_id, feature_id, feature_label]
 */
function toAttributeRows(cell, terms) {
  return asList(cell.descriptive_attribute).map(
    ([type_id, combination_id, feature_id, feature_label]) => ({
      type_id,
      combination_id,
      feature_id,
      feature_label: getTermLabel(terms, feature_id, feature_label),
    }),
  );
}

function toLocationRows(cell, terms) {
  return asList(cell.node).map(([type_id, node_id, feature_id, feature_label]) => ({
    type_id,
    node_id,
    feature_id,
    feature_label: getTermLabel(terms, feature_id, feature_label),
  }));
}

/**
 * Gene expression rows are grouped by combination_id.
 * Expression levels (ilxtr:HigherExpression / ilxtr:LowerExpression) are rows in the same combination.
 */
function buildMarkerGenes(attributeRows) {
  const combinations = new Map();

  attributeRows
    .filter(
      (row) => row.type_id === ATTRIBUTE_TYPES.GENE || row.type_id === ATTRIBUTE_TYPES.EXPRESSION,
    )
    .forEach((row) => {
      const key = row.combination_id || row.feature_id;
      if (!combinations.has(key)) {
        combinations.set(key, { genes: [], expression: '' });
      }
      const combination = combinations.get(key);

      if (EXPRESSION_LEVELS[row.feature_id]) {
        combination.expression = EXPRESSION_LEVELS[row.feature_id];
      } else if (!isMissingValue(row.feature_id)) {
        combination.genes.push(row);
      }
    });

  const markerGenes = [];
  const seen = new Set();

  combinations.forEach(({ genes, expression }) => {
    genes.forEach((gene) => {
      const key = `${gene.feature_id}|${expression}`;
      if (seen.has(key)) return;
      seen.add(key);

      markerGenes.push({
        id: gene.feature_id,
        // Some genes have no label yet, so the label is the CURIE.
        name: String(gene.feature_label || gene.feature_id).trim(),
        uri: getGeneUri(gene.feature_id),
        expression,
      });
    });
  });

  return markerGenes;
}

function getAttributeLabels(attributeRows, typeIds, transform = (label) => label) {
  const types = Array.isArray(typeIds) ? typeIds : [typeIds];
  return unique(
    attributeRows
      .filter((row) => types.includes(row.type_id) && !isMissingValue(row.feature_id))
      .map((row) => transform(String(row.feature_label || row.feature_id).trim())),
  );
}

function getLocationTerms(locationRows, typeId) {
  const terms = new Map();
  locationRows
    .filter((row) => row.type_id === typeId && !isMissingValue(row.feature_id))
    .forEach((row) => {
      const curie = String(row.feature_id || '').trim();
      const label = String(row.feature_label || curie).trim();
      if (label && !terms.has(curie || label)) {
        terms.set(curie || label, { label, curie });
      }
    });
  return [...terms.values()];
}

function getSpecies(taxonIds, terms) {
  return unique(
    asList(taxonIds).map((taxonId) => TAXON_NAMES[taxonId] || terms.get(taxonId)?.label || ''),
  ).join(', ');
}

/**
 * Synonyms of the attributes and locations of a cell, for the text search.
 */
function getSynonyms(attributeRows, locationRows, terms) {
  return unique(
    [...attributeRows, ...locationRows].flatMap((row) =>
      (terms.get(row.feature_id)?.synonyms || []).filter(
        (synonym) => synonym.length >= MIN_SYNONYM_LENGTH,
      ),
    ),
  );
}

function buildCellCard(cell, terms) {
  const label = cleanText(cell.cell_label || cell.cell_id);
  const { name, citationKey } = parseCellLabel(label);
  const source = getSourcePublication(cell.reference, citationKey);

  const attributeRows = toAttributeRows(cell, terms);
  const locationRows = toLocationRows(cell, terms);

  const markerGenes = buildMarkerGenes(attributeRows);
  const somaLocationTerms = getLocationTerms(locationRows, LOCATION_TYPES.SOMA);
  const sensoryTerminalTerms = getLocationTerms(locationRows, LOCATION_TYPES.SENSORY_TERMINAL);
  const presynapticTerminalTerms = getLocationTerms(
    locationRows,
    LOCATION_TYPES.PRESYNAPTIC_TERMINAL,
  );

  return {
    id: cell.cell_id,
    cellId: cell.cell_id,
    entity: label,
    longLabel: cleanText(cell.long_label),
    preferredLabel: name || label,
    citationKey,
    taxonIds: asList(cell.taxon_id),
    species: getSpecies(cell.taxon_id, terms),
    biologicalSex: cell.biological_sex || '',
    phenotypes: asList(cell.phenotype),
    circuitRole: getAttributeLabels(attributeRows, ATTRIBUTE_TYPES.CIRCUIT).join(', '),
    neurotransmitter: getAttributeLabels(attributeRows, ATTRIBUTE_TYPES.NEUROTRANSMITTER).join(
      ', ',
    ),
    somaLocations: somaLocationTerms.map((term) => term.label),
    somaLocationTerms,
    sensoryTerminalLocations: sensoryTerminalTerms.map((term) => term.label),
    sensoryTerminalStructures: getAttributeLabels(attributeRows, ATTRIBUTE_TYPES.SENSORY_STRUCTURE),
    axonTerminalLocations: presynapticTerminalTerms.map((term) => term.label),
    markerGenes,
    geneBaseNames: unique(markerGenes.map((gene) => gene.name.toLowerCase())),
    geneExpressionString: markerGenes
      .map((gene) => (gene.expression ? `${gene.name}^${gene.expression}` : gene.name))
      .join(' + '),
    fiberTypeString: getAttributeLabels(attributeRows, ATTRIBUTE_TYPES.AXON).join(' + '),
    physiologyString: getAttributeLabels(
      attributeRows,
      PHYSIOLOGY_TYPES,
      removePhenotypeSuffix,
    ).join(' + '),
    // Driver lines without a label are shown by id, e.g. JAX:021077.
    creLine: getAttributeLabels(attributeRows, ATTRIBUTE_TYPES.DRIVER).join(', '),
    sourceNomenclature: source.uri,
    sourceNomenclatureLabel: source.label,
    sourceColor: source.color,
    alertNotes: parseAlert(cell.alert),
    curatorNotes: asList(cell.curator_note).map(cleanText),
    sourceData: getSourceData(cell.dataset_id),
    synonyms: getSynonyms(attributeRows, locationRows, terms),
    superclassIds: asList(cell.superclass_id),
    mapsToIds: asList(cell.maps_to_id),
    // Filled in by linkCells.
    relatedCells: [],
    equivalentCells: [],
  };
}

const toCellLink = (card) => ({
  id: card.id,
  label: card.preferredLabel,
  species: card.species,
});

/**
 * relatedCells:    the other subclasses of the same superclass, e.g. the species variants
 *                  "DRG Pvalb mouse (Bhuiyan2024)" <-> "DRG Pvalb human (Bhuiyan2024)".
 * equivalentCells: cells linked by maps-to (the equivalent cell type from another study),
 *                  in both directions. The API only gives the forward direction.
 * Only cells that have a card are linked.
 */
function linkCells(cards, cells) {
  const cardsById = new Map(cards.map((card) => [card.id, card]));
  const subclassesById = new Map(cells.map((cell) => [cell.cell_id, asList(cell.subclass_id)]));
  const mappedFrom = new Map();

  cards.forEach((card) => {
    card.mapsToIds.forEach((targetId) => {
      if (!mappedFrom.has(targetId)) mappedFrom.set(targetId, []);
      mappedFrom.get(targetId).push(card.id);
    });
  });

  cards.forEach((card) => {
    const siblingIds = card.superclassIds.flatMap(
      (superclassId) => subclassesById.get(superclassId) || [],
    );
    const equivalentIds = [...card.mapsToIds, ...(mappedFrom.get(card.id) || [])];

    card.relatedCells = unique(siblingIds)
      .filter((id) => id !== card.id && cardsById.has(id))
      .map((id) => toCellLink(cardsById.get(id)));

    card.equivalentCells = unique(equivalentIds)
      .filter((id) => id !== card.id && cardsById.has(id))
      .map((id) => toCellLink(cardsById.get(id)));
  });
}

/**
 * @param {Object} data
 * @param {Array<Object>} data.cells rows of query 40
 * @param {Array<Object>} [data.terms] rows of query 39 for the terms used by the cells
 * @returns {Array<Object>} cell cards for the individual cells (cells without subclasses);
 *          classes (query 31) only link their subclasses together.
 */
function buildCellCards({ cells = [], terms = [] }) {
  const termLookup = buildTermLookup(terms);
  const seen = new Set();
  const uniqueCells = asList(cells).filter((cell) => {
    if (!cell?.cell_id || seen.has(cell.cell_id)) return false;
    seen.add(cell.cell_id);
    return true;
  });

  const cards = uniqueCells
    .filter((cell) => !asList(cell.subclass_id).length)
    .map((cell) => buildCellCard(cell, termLookup));

  linkCells(cards, uniqueCells);

  return cards.sort((a, b) =>
    a.entity.localeCompare(b.entity, undefined, { sensitivity: 'base', numeric: true }),
  );
}

/**
 * Every term id used by the cells: attributes, nodes and species.
 */
function getCellTermIds(cells) {
  return unique(
    asList(cells).flatMap((cell) => [
      ...asList(cell.descriptive_attribute).map((attribute) => attribute[2]),
      ...asList(cell.node).map((node) => node[2]),
      ...asList(cell.taxon_id),
    ]),
  ).filter((id) => !EXPRESSION_LEVELS[id]);
}

export {
  buildCellCards,
  getCellTermIds,
  parseCellLabel,
  parseAlert,
  decodeEntities,
  SOURCE_PUBLICATIONS,
};
