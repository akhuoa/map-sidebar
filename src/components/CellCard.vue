<template>
  <div ref="cardElementRef" class="card" :class="{ active: isActive }" :style="cardStyleVars">
    <div class="card-header" @click="openCard">
      <div class="title-content">
        <div class="card-title">
          {{ cellType.preferredLabel }}
        </div>
        <div class="card-keywords">
          <span>{{ cellType.species }}</span>
          <div class="card-chips">
            <span
              v-for="somaLocation in cellType.somaLocations"
              class="card-chip"
              :key="somaLocation"
            >
              {{ somaLocation }}
            </span>
          </div>
          <span class="source-publication-chip" v-if="cellType.sourceNomenclature">
            {{ cellType.sourceNomenclatureLabel }}
          </span>
        </div>
        <el-button
          v-if="isActive && (cellType.alertNotes?.length || cellType.curatorNotes?.length)"
          round
          size="small"
          class="alert-chip"
          @click.stop="showAlertMessage"
        >
          <el-icon class="alert"><el-icon-warn-triangle-filled /></el-icon>
          Notes
        </el-button>
      </div>
      <div class="title-buttons" @click.stop>
        <CopyToClipboard @copied="onCopied" :content="updatedCopyContent" />
        <el-popover width="auto" trigger="hover" :teleported="false" popper-class="popover-map-pin">
          <template #reference>
            <el-button class="button-circle" circle @click="closeCard">
              <el-icon color="white">
                <el-icon-close />
              </el-icon>
            </el-button>
          </template>
          <span>Close</span>
        </el-popover>
      </div>
    </div>
    <div class="card-details">
      <div class="card-details-inner">
        <div v-if="cellType.entity" class="card-section">
          <div class="card-section-title">Entity</div>
          <span>{{ cellType.entity }}</span>
        </div>
        <div v-if="cellType.species" class="card-section">
          <div class="card-section-title">Species</div>
          <span>{{ cellType.species }}</span>
        </div>
        <!-- Soma locations and axon terminals: the locations can be shown on the map and searched -->
        <div v-for="section in locationSections" :key="section.key" class="card-section">
          <div class="card-section-title">{{ section.title }}</div>
          <div v-for="group in section.groups" :key="group.key" class="card-list-group">
            <div v-if="group.label" class="card-list-group-label">{{ group.label }}</div>
            <div v-if="group.locations.length" class="card-list-items">
              <div
                v-for="location in group.locations"
                class="card-list-item"
                :key="location.id"
                @mouseenter="showLocation(location)"
                @mouseleave="showLocation()"
              >
                <span>{{ location.name }}</span>
                <div class="card-list-search">
                  <el-popover
                    width="180"
                    trigger="hover"
                    :teleported="true"
                    :append-to="cardElement"
                    popper-class="popover-origin-help popover-search-actions"
                    @show="onSearchPopoverShow(location.id)"
                    @hide="onSearchPopoverHide(location.id)"
                  >
                    <template #reference>
                      <el-icon
                        class="status-search-icon"
                        :class="{ 'is-visible': activeSearchPopoverLocationId === location.id }"
                      >
                        <el-icon-search />
                      </el-icon>
                    </template>
                    <div class="search-action-list">
                      <button
                        type="button"
                        class="search-action-button"
                        @click="openDatasetSearch(location.name)"
                      >
                        Search dataset
                      </button>
                      <button
                        type="button"
                        class="search-action-button"
                        @click="openConnectivitySearch(location)"
                      >
                        Search connectivity
                      </button>
                    </div>
                  </el-popover>
                </div>
              </div>
            </div>
            <div
              v-for="endingType in group.endingTypes"
              :key="endingType"
              class="card-list-group-note"
            >
              Ending type: {{ endingType }}
            </div>
          </div>
        </div>
        <div v-if="cellType.circuitRole" class="card-section">
          <div class="card-section-title">Circuit Role</div>
          <span>{{ cellType.circuitRole }}</span>
        </div>
        <div v-if="cellType.neurotransmitter" class="card-section">
          <div class="card-section-title">Neurotransmitter</div>
          <span>{{ cellType.neurotransmitter }}</span>
        </div>
        <div v-if="cellType.creLine" class="card-section">
          <div class="card-section-title">Cre Line</div>
          <span>{{ cellType.creLine }}</span>
        </div>
        <div v-if="formattedMarkerGenes.length" class="card-section">
          <div class="card-section-title">Marker Genes</div>
          <div class="marker-genes-list">
            <a
              v-for="markerGene in formattedMarkerGenes"
              :key="markerGene.key"
              class="marker-gene-link"
              :href="markerGene.uri"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{{ markerGene.name }}</span>
              <sup v-if="markerGene.expression">{{ markerGene.expression }}</sup>
              <IconOpenExternal class="external-link-icon" />
            </a>
          </div>
        </div>
        <div v-if="cellType.fiberTypeString" class="card-section">
          <div class="card-section-title">Axon Phenotype</div>
          <div class="card-section-content">{{ cellType.fiberTypeString }}</div>
        </div>
        <div v-if="cellType.physiologyString" class="card-section">
          <div class="card-section-title">Physiology</div>
          <div class="card-section-content success">{{ cellType.physiologyString }}</div>
        </div>
        <div v-if="cellType.cellId" class="card-section">
          <div class="card-section-title">Neuron Populations</div>
          <el-button
            size="small"
            class="neuron-populations-button"
            @click.stop="openNeuronPopulationSearch"
          >
            Search related connectivity
          </el-button>
        </div>
        <div v-if="cellType.relatedCells?.length" class="card-section">
          <div class="card-section-title">Related Species Variants</div>
          <ul class="related-cell-list">
            <li
              v-for="relatedCell in cellType.relatedCells"
              :key="relatedCell.id || relatedCell.label"
            >
              <button
                class="related-cell-item"
                @click.stop="$emit('related-cell-click', relatedCell)"
                title="Click to view this cell type"
              >
                {{ relatedCell.label }}
              </button>
            </li>
          </ul>
        </div>
        <div v-if="cellType.equivalentCells?.length" class="card-section">
          <div class="card-section-title">Equivalent Cell Types</div>
          <ul class="related-cell-list">
            <li v-for="equivalentCell in equivalentCellLinks" :key="equivalentCell.key">
              <el-popover
                :disabled="!equivalentCell.isOtherSpecies"
                :width="200"
                trigger="hover"
                placement="right"
                :fallback-placements="['top', 'bottom']"
                :teleported="false"
                popper-class="popover-map-pin popover-species-hint"
              >
                <template #reference>
                  <button
                    class="related-cell-item equivalent-cell-item"
                    :aria-label="equivalentCell.isOtherSpecies ? equivalentCell.tooltip : undefined"
                    @click.stop="$emit('related-cell-click', equivalentCell.cell)"
                  >
                    <span>{{ equivalentCell.label }}</span>
                    <span
                      v-if="equivalentCell.speciesLabel"
                      class="species-tag"
                      :class="{ 'species-tag--other': equivalentCell.isOtherSpecies }"
                    >
                      {{ equivalentCell.speciesLabel }}
                    </span>
                  </button>
                </template>
                <span>{{ equivalentCell.tooltip }}</span>
              </el-popover>
            </li>
          </ul>
        </div>
        <div v-if="cellType.sourceNomenclature" class="card-section source-publication-section">
          <div class="card-section-title">Source Publication</div>
          <p>
            <a
              class="source-publication-link"
              :href="cellType.sourceNomenclature"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ cellType.sourceNomenclatureLabel }}
              <IconOpenExternal class="external-link-icon" />
            </a>
          </p>
        </div>
        <div v-if="sourceDataLinks.length" class="card-section source-publication-section">
          <div class="card-section-title">Source Data</div>
          <p v-for="dataset in sourceDataLinks" :key="dataset.uri">
            <a
              class="source-publication-link"
              :href="dataset.uri"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ dataset.label }}
              <IconOpenExternal class="external-link-icon" />
            </a>
          </p>
        </div>
        <div
          class="card-section"
          v-if="cellType.alertNotes?.length || cellType.curatorNotes?.length"
          ref="alertElement"
        >
          <div class="card-section-title">Notes</div>
          <div class="alert-block">
            <div class="alert-block-section" v-if="cellType.alertNotes?.length">
              <div class="alert-block-title">Alert Notes:</div>
              <div
                v-for="(note, index) in cellType.alertNotes"
                :key="`alert-${index}`"
                v-html="formatAlertText(note)"
                class="alert-block-note"
              ></div>
            </div>
            <div class="alert-block-section" v-if="cellType.curatorNotes?.length">
              <div class="alert-block-title">Curator Notes:</div>
              <div
                v-for="(note, index) in cellType.curatorNotes"
                :key="`curator-${index}`"
                v-html="formatAlertText(note)"
                class="alert-block-note"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { CopyToClipboard } from '@abi-software/map-utilities';
import '@abi-software/map-utilities/dist/style.css';
import EventBus from './EventBus.js';
import {
  capitalise,
  formatAlertText as formatAlertTextUtil,
  scrollToRef,
} from '../utils/common.js';
import IconOpenExternal from './icons/IconOpenExternal.vue';

export default {
  name: 'CellCard',
  components: {
    CopyToClipboard,
    IconOpenExternal,
  },
  props: {
    cellType: {
      type: Object,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    'open',
    'close',
    'soma-location-hovered',
    'dataset-search',
    'connectivity-search',
    'related-cell-click',
    'cell-connectivity-search',
  ],
  data() {
    return {
      cardElement: null,
      activeSearchPopoverLocationId: null,
    };
  },
  mounted: function () {
    this.cardElement = this.$refs.cardElementRef;
  },
  computed: {
    cardStyleVars: function () {
      return {
        '--cell-card-source-color': this.cellType?.sourceColor || this.cellType?.color || '#8300bf',
      };
    },
    formattedMarkerGenes: function () {
      return (this.cellType?.markerGenes || [])
        .map((markerGene, index) => {
          const name = String(markerGene?.name || '').trim();
          const expression = String(markerGene?.expression || '').trim();
          const uri = this.sanitizeMarkerGeneUri(markerGene?.uri, expression);

          if (!name || !uri) {
            return null;
          }

          return {
            key: `${name}-${expression || 'none'}-${index}`,
            name,
            expression,
            uri,
          };
        })
        .filter(Boolean);
    },
    /**
     * Equivalent cells (maps-to) with a species tag. A cell from another species than this card
     * gets a highlighted tag and a tooltip, because opening it changes the species filter.
     */
    equivalentCellLinks: function () {
      const cardSpecies = String(this.cellType?.species || '')
        .trim()
        .toLowerCase();

      return (this.cellType?.equivalentCells || [])
        .filter((cell) => cell?.label)
        .map((cell, index) => {
          const species = String(cell.species || '')
            .trim()
            .toLowerCase();
          const speciesLabel = capitalise(species);
          const isOtherSpecies = Boolean(species && cardSpecies && species !== cardSpecies);

          return {
            key: cell.id || `${cell.label}-${index}`,
            cell,
            label: cell.label,
            speciesLabel,
            isOtherSpecies,
            tooltip: isOtherSpecies
              ? `Opening it includes ${speciesLabel} in the species filter.`
              : '',
          };
        });
    },
    // Dataset links (SCKAN data citations, e.g. GEO accessions) the cell was derived from.
    sourceDataLinks: function () {
      return (this.cellType?.sourceData || [])
        .filter((dataset) => dataset?.uri)
        .map((dataset) => ({ uri: dataset.uri, label: dataset.label || dataset.uri }));
    },
    updatedCopyContent: function () {
      const {
        preferredLabel,
        entity,
        species,
        somaLocations,
        sensoryTerminalLocations,
        sensoryTerminalStructures,
        axonTerminalLocations,
        circuitRole,
        neurotransmitter,
        creLine,
        geneExpressionString,
        fiberTypeString,
        physiologyString,
        relatedCells,
        equivalentCells,
        sourceData,
        alertNotes,
        curatorNotes,
        sourceNomenclature,
        sourceNomenclatureLabel,
      } = this.cellType;

      // CopyToClipboard copies this as HTML and as plain text (textContent).
      // The new lines and leading spaces only show in the plain text:
      // the HTML copy removes the new lines, and spaces at the start of a block are not displayed.
      const listSection = (title, items) => {
        const listItems = items
          .filter(Boolean)
          .map((item) => `\n<li>  ${item}</li>`)
          .join('');
        return listItems ? `<div><strong>${title}:</strong><ul>${listItems}</ul></div>` : '';
      };
      // Notes are indented as on the card: each line in its own indented block.
      const notesSection = (title, notes) => {
        const noteLines = notes
          .flatMap((note) => formatAlertTextUtil(note).split('\n'))
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => `\n<div>&nbsp;&nbsp;${line}</div>`)
          .join('');
        return noteLines ? `<div><strong>${title}:</strong></div>${noteLines}` : '';
      };

      const contentArray = [];
      if (preferredLabel) {
        contentArray.push(`<div><strong>Cell Type:</strong> ${preferredLabel}</div>`);
      }
      if (entity) {
        contentArray.push(`<div><strong>Entity:</strong> ${entity}</div>`);
      }
      if (species) {
        contentArray.push(`<div><strong>Species:</strong> ${species}</div>`);
      }
      if (somaLocations?.length) {
        contentArray.push(listSection('Soma Locations', somaLocations));
      }
      const terminalLines = [];
      if (axonTerminalLocations?.length) {
        terminalLines.push(
          `<div>&nbsp;&nbsp;Central (presynaptic): ${axonTerminalLocations.join(', ')}</div>`,
        );
      }
      if (sensoryTerminalLocations?.length || sensoryTerminalStructures?.length) {
        terminalLines.push(
          `<div>&nbsp;&nbsp;Peripheral (sensory): ${(sensoryTerminalLocations || []).join(', ')}</div>`,
        );
        (sensoryTerminalStructures || []).forEach((structure) => {
          terminalLines.push(`<div>&nbsp;&nbsp;&nbsp;&nbsp;Ending type: ${structure}</div>`);
        });
      }
      if (terminalLines.length) {
        contentArray.push(
          `<div><strong>Axon Terminals:</strong></div>${terminalLines.map((line) => `\n${line}`).join('')}`,
        );
      }
      if (circuitRole) {
        contentArray.push(`<div><strong>Circuit Role:</strong> ${circuitRole}</div>`);
      }
      if (neurotransmitter) {
        contentArray.push(`<div><strong>Neurotransmitter:</strong> ${neurotransmitter}</div>`);
      }
      if (creLine) {
        contentArray.push(`<div><strong>Cre Line:</strong> ${creLine}</div>`);
      }
      if (geneExpressionString) {
        contentArray.push(`<div><strong>Marker Genes:</strong> ${geneExpressionString}</div>`);
      }
      if (fiberTypeString) {
        contentArray.push(`<div><strong>Axon Phenotype:</strong> ${fiberTypeString}</div>`);
      }
      if (physiologyString) {
        contentArray.push(`<div><strong>Physiology:</strong> ${physiologyString}</div>`);
      }
      if (relatedCells?.length) {
        contentArray.push(
          listSection(
            'Related Species Variants',
            relatedCells.map((cell) => cell?.label),
          ),
        );
      }
      if (equivalentCells?.length) {
        contentArray.push(
          listSection(
            'Equivalent Cell Types',
            equivalentCells
              .filter((cell) => cell?.label)
              .map((cell) => `${cell.label}${cell.species ? ` (${cell.species})` : ''}`),
          ),
        );
      }
      if (sourceNomenclatureLabel) {
        const sourceLabel = sourceNomenclature
          ? `${sourceNomenclatureLabel} (<a href="${sourceNomenclature}">${sourceNomenclature}</a>)`
          : sourceNomenclatureLabel;
        contentArray.push(`<div><strong>Source Publication:</strong> ${sourceLabel}</div>`);
      }
      contentArray.push(
        listSection(
          'Source Data',
          (sourceData || [])
            .filter((dataset) => dataset?.uri)
            .map((dataset) =>
              dataset.label && dataset.label !== dataset.uri
                ? `${dataset.label} (<a href="${dataset.uri}">${dataset.uri}</a>)`
                : `<a href="${dataset.uri}">${dataset.uri}</a>`,
            ),
        ),
      );

      if (alertNotes?.length) {
        contentArray.push(notesSection('Alert Notes', alertNotes));
      }

      if (curatorNotes?.length) {
        contentArray.push(notesSection('Curator Notes', curatorNotes));
      }

      return contentArray.filter(Boolean).join('\n');
    },
    /**
     * Soma locations and axon terminals. Locations have UBERON curies from the API (query 40),
     * so they can be shown on the map and used for dataset and connectivity searches.
     * Axon terminals are split into the central (presynaptic) and peripheral (sensory)
     * branches; sensory ending types are not locations and are shown as notes.
     */
    locationSections: function () {
      const toLocations = (groupKey, terms, labels) => {
        const source = terms?.length
          ? terms
          : (labels || []).map((label) => ({ label, curie: '' }));
        return source
          .filter((term) => term?.label)
          .map((term) => ({
            name: capitalise(term.label),
            label: term.label,
            curie: term.curie || '',
            id: `${groupKey}-${term.curie || term.label}`,
          }));
      };

      const somaLocations = toLocations(
        'soma',
        this.cellType.somaLocationTerms,
        this.cellType.somaLocations,
      );
      const centralTerminals = toLocations(
        'central',
        this.cellType.axonTerminalTerms,
        this.cellType.axonTerminalLocations,
      );
      const peripheralTerminals = toLocations(
        'peripheral',
        this.cellType.sensoryTerminalTerms,
        this.cellType.sensoryTerminalLocations,
      );
      const endingTypes = (this.cellType.sensoryTerminalStructures || []).filter(Boolean);

      const sections = [];
      if (somaLocations.length) {
        sections.push({
          key: 'soma',
          title: 'Soma Location',
          groups: [{ key: 'soma', label: '', locations: somaLocations, endingTypes: [] }],
        });
      }

      const terminalGroups = [];
      if (centralTerminals.length) {
        terminalGroups.push({
          key: 'central',
          label: 'Central (presynaptic)',
          locations: centralTerminals,
          endingTypes: [],
        });
      }
      if (peripheralTerminals.length || endingTypes.length) {
        terminalGroups.push({
          key: 'peripheral',
          label: 'Peripheral (sensory)',
          locations: peripheralTerminals,
          endingTypes,
        });
      }
      if (terminalGroups.length) {
        sections.push({ key: 'terminals', title: 'Axon Terminals', groups: terminalGroups });
      }

      return sections;
    },
  },
  methods: {
    sanitizeMarkerGeneUri: function (uri, expression = '') {
      let normalizedUri = String(uri || '').trim();
      const normalizedExpression = String(expression || '').trim();

      if (!normalizedUri) return '';

      if (normalizedExpression) {
        const escapedExpression = normalizedExpression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        normalizedUri = normalizedUri.replace(new RegExp(`\\s+${escapedExpression}$`, 'i'), '');
      }

      return normalizedUri.trim();
    },
    transformString: function (str) {
      if (!str) return '';
      // replace the string with ^ with <sup> and the next word with </sup>
      return str.replace(/\^(\w+)/g, '<sup>$1</sup>');
    },
    onCopied: function () {
      EventBus.emit('trackEvent', {
        event_name: `portal_maps_cell_card_copy`,
        category: this.cellType.preferredLabel || '',
        location: 'map_sidebar_cell_card',
      });
    },
    openCard: function () {
      this.$emit('open', this.cellType.id);

      EventBus.emit('trackEvent', {
        event_name: `portal_maps_cell_card_open`,
        category: this.cellType.id || '',
        location: 'map_sidebar_cell_card',
      });
    },
    closeCard: function () {
      this.$emit('close');

      EventBus.emit('trackEvent', {
        event_name: `portal_maps_cell_card_close`,
        category: this.cellType.id || '',
        location: 'map_sidebar_cell_card',
      });
    },
    // The curie lets the map find the feature by id; the name is the fallback (text search).
    showLocation: function (location) {
      this.$emit('soma-location-hovered', location?.name, location?.curie || undefined);
    },
    openDatasetSearch: function (query) {
      this.$emit('dataset-search', {
        species: capitalise(this.cellType?.species),
        location: query,
      });
    },
    getLocationCurie: function (location) {
      if (location?.curie) {
        return location.curie;
      }

      // Fallback: find the UBERON term from the location label
      const label = String(location?.label || location?.name || '').toLowerCase();
      try {
        const availableDataRaw = localStorage.getItem('available-name-curie-mapping');
        const availableData = availableDataRaw ? JSON.parse(availableDataRaw) : {};
        return Object.keys(availableData).find(
          (curie) => String(availableData[curie] || '').toLowerCase() === label,
        );
      } catch {
        return '';
      }
    },
    openConnectivitySearch: function (location) {
      const query = location?.name || '';
      const locationCurie = this.getLocationCurie(location);
      const facets = locationCurie
        ? [
            {
              facet: `["${locationCurie}",[]]`,
              facetPropPath: 'flatmap.connectivity.source.all',
              tagLabel: query,
              term: 'All',
            },
          ]
        : [];
      this.$emit('connectivity-search', {
        facets: facets,
        query: '',
      });
    },
    openNeuronPopulationSearch: function () {
      this.$emit('cell-connectivity-search', this.cellType);
    },
    onSearchPopoverShow: function (locationId) {
      this.activeSearchPopoverLocationId = locationId;
    },
    onSearchPopoverHide: function (locationId) {
      if (this.activeSearchPopoverLocationId === locationId) {
        this.activeSearchPopoverLocationId = null;
      }
    },
    showAlertMessage: function () {
      scrollToRef(this, 'alertElement');
    },
    formatAlertText: function (text) {
      return formatAlertTextUtil(text);
    },
  },
};
</script>

<style lang="scss" scoped>
.card {
  position: relative;
  font-family: Asap;
  font-size: 14px;
  box-sizing: border-box;

  &::before {
    content: '';
    position: absolute;
    top: 5px;
    left: 5px;
    width: calc(100% - 15px);
    height: calc(100% - 10px);
    border: 3px solid transparent;
    border-radius: 5px;
    box-sizing: border-box;
    z-index: 1;
  }

  &.active::before,
  &:hover::before {
    border-color: $app-primary-color;
  }

  &:not(:first-child) {
    margin-top: 5px;

    &::after {
      content: '';
      position: absolute;
      top: 0px;
      left: 10px;
      width: 455px; // Same as other cards in the sidebar
      height: 2px; // Same as other cards in the sidebar
      background-color: #e4e7ed;
      z-index: 0;
    }
  }

  .card-details {
    display: none;
  }

  &.active {
    background-color: #f7faff;

    &::before {
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .card-header {
      cursor: default;

      &::before {
        opacity: 1;
      }

      .card-title {
        margin: 0;
        line-height: 1.3em !important;
        font-size: 18px;
        font-weight: bold;
        color: $app-primary-color;
      }

      .card-keywords {
        display: none;
      }
    }

    .card-details {
      display: block;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  cursor: pointer;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    bottom: 7px;
    left: 5px;
    width: calc(100% - 10px);
    height: 1px;
    opacity: 0;
    transition: opacity 0.25s ease;
  }
}

.card-header,
.card-details {
  position: relative;
  z-index: 2;
}

.card-header,
.card-details-inner {
  padding: 1rem;
}

.title-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.card-title {
  margin-bottom: 0.75rem;
  font-weight: bold;
  line-height: 1.5;
  letter-spacing: 1.05px;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-details-inner {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  padding-top: 0;
}

.card-keywords,
.card-chips {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  span {
    color: #606266;
  }
}

.card-chip {
  display: inline-block;
  padding: 2px 8px;
  background-color: #f0f0f0;
  border-radius: 12px;
  transition: background-color 0.2s ease;

  .card-details & {
    padding: 4px 8px;
    border: 1px solid #dcdcdc;
  }
}

.card-list-items {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  box-sizing: border-box;
  position: relative;
}

.card-list-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem;
  position: relative;
  box-sizing: border-box;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease;
    background-color: rgba($app-primary-color, 0.04);
    border-left: 4px solid rgba($app-primary-color, 0.16);
  }

  &:hover::before {
    background-color: rgba($app-primary-color, 0.07);
    border-left-color: rgba($app-primary-color, 0.24);
  }

  > span {
    line-height: 1.5em;
    font-weight: 500;
  }
}

.card-list-group + .card-list-group {
  margin-top: 0.75rem;
}

.card-list-group-label {
  margin-bottom: 0.25rem;
  color: $mediumGrey;
  font-size: 13px;
  font-weight: 500;
}

.card-list-group-note {
  margin-top: 0.25rem;
  padding-left: 0.5rem;
  color: $mediumGrey;
  font-size: 13px;
}

.neuron-populations-button {
  color: $app-primary-color;
  border-color: $app-primary-color;

  &:hover,
  &:focus {
    color: #fff;
    background-color: $app-primary-color;
    border-color: $app-primary-color;
  }
}

.card-list-search {
  display: flex;
  gap: 0.25rem;
}

.status-search-icon {
  font-size: 16px;
  color: $app-primary-color;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;

  &.is-visible {
    opacity: 1;
  }

  &:hover {
    color: #ac76c5;
  }
}

.card-list-item:hover .status-search-icon {
  opacity: 1;
}

:deep(.popover-origin-help.el-popover) {
  font-family: 'Asap', sans-serif;
  background: #f3ecf6 !important;
  border: 1px solid $app-primary-color !important;
  border-radius: 4px !important;
  color: #303133 !important;
  text-transform: none !important; // need to overide the tooltip text transform
  font-weight: 400;

  .el-popper__arrow {
    &:before {
      background: #f3ecf6 !important;
      border-color: $app-primary-color;
      background-color: #ffffff;
    }
  }
}

:deep(.popover-search-actions.el-popover) {
  padding: 6px;
}

.search-action-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.search-action-button {
  border: 0;
  width: 100%;
  padding: 6px 8px;
  text-align: left;
  border-radius: 4px;
  font-family: inherit;
  font-size: 12px;
  color: #303133;
  background: transparent;
  cursor: pointer;

  &:hover {
    background-color: rgba($app-primary-color, 0.12);
    color: $app-primary-color;
  }
}

.card-section {
  .card-section-title {
    font-weight: 600;
  }

  p {
    margin: 0;
    color: #606266;
  }

  ul {
    margin: 0;
    padding-left: 1rem;

    &.related-cell-list {
      list-style-type: none;
      padding-left: 0;
    }

    li {
      color: #606266;
    }
  }
}

.card-section {
  .card-section-title {
    display: block;
    margin-bottom: 0.75rem;
    font-size: 16px;
    font-weight: 600;
    text-transform: uppercase;
  }
}

.card-section-content {
  padding: 0.5rem;
  background-color: #f0f0f0;
  border-radius: 4px;
  border: 1px solid #dcdcdc;

  &.success {
    border-color: #b3e5b3;
    background-color: #f0f9eb;
  }
}

.marker-genes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.marker-gene-link {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.1rem;
  padding: 0.25rem 0.5rem;
  font-size: 12px;
  border: 1px solid $app-primary-color;
  border-radius: 4px;
  color: $app-primary-color;
  background-color: #f9f2fc;
  text-decoration: none;
  line-height: 1.2;

  &:hover {
    background-image: linear-gradient(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05));
  }

  sup {
    font-size: 0.75em;
    line-height: 1;
  }
}

.external-link-icon {
  display: inline-flex;
  align-items: center;
  width: 16px;
  height: 16px;
  margin-left: 2px;
  color: currentColor;
  opacity: 0.7;
  vertical-align: middle;
}

.source-publication-chip,
.source-publication-link {
  display: inline-block;
  border-radius: 4px;
  color: white !important;
  text-decoration: none;
  background-color: var(--cell-card-source-color);
}

.source-publication-chip {
  padding: 2px 8px;
  font-size: 13px;
}

.alert-chip {
  margin-top: 5px;
  background-color: $app-primary-color;
  border-color: $app-primary-color;
  color: #fff;

  &:hover {
    color: #fff !important;
    background-color: #ac76c5 !important;
    border: 1px solid #ac76c5 !important;
  }

  :deep(> span) {
    gap: 2px;
  }

  .alert {
    width: 1rem;
    height: 1rem;
    color: inherit;
    margin: 0;
  }
}

.source-publication-link {
  padding: 4px 8px;

  &:hover {
    background-image: linear-gradient(rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.12));
  }
}

:deep(.el-popper.popover-map-pin) {
  padding: 4px 10px;
  min-width: max-content;
  font-family: Asap;
  font-size: 12px;
  line-height: inherit;
  color: inherit;
  background: #f3ecf6 !important;
  border: 1px solid $app-primary-color;

  & .el-popper__arrow::before {
    border: 1px solid;
    border-color: $app-primary-color;
    background: #f3ecf6;
  }
}

.title-buttons {
  flex: 1 0 0%;
  max-width: 20%;
  flex-direction: row;
  justify-content: end;
  gap: 0.5rem;
  display: none;

  .card.active & {
    display: flex;
  }

  :deep(.copy-clipboard-button) {
    &,
    &:hover,
    &:focus {
      border-color: $app-primary-color !important;
      border-radius: 50%;
    }

    &.is-disabled {
      border-color: #dab3ec !important;
    }
  }

  .el-button + .el-button {
    margin-left: 0 !important;
  }
}

.button-circle {
  margin: 0;
  width: 24px !important;
  height: 24px !important;
  border: 1px solid $app-primary-color !important;

  &,
  &:hover,
  &:focus,
  &:active {
    background-color: $app-primary-color;
    border-color: $app-primary-color !important;
  }

  &.secondary {
    background-color: white !important;
  }
}

.alert-block {
  background-color: var(--el-color-warning-light-9);
  border: 1px dashed var(--el-color-warning);
  padding: 0.75rem;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  :deep(a) {
    color: $app-primary-color;
    word-break: break-all;

    &:hover {
      opacity: 0.8;
    }
  }
}

.alert-block-section {
  .alert-block-title {
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .alert-block-note {
    color: #606266;
    padding-left: 0.5rem;

    + .alert-block-note {
      margin-top: 0.5rem;
    }
  }
}

.related-cell-list {
  li + li {
    margin-top: 0.5rem;
  }
}

.related-cell-item {
  cursor: pointer;
  color: $app-primary-color;
  background: none;
  border: 1px solid $app-primary-color;
  border-radius: 4px;
  padding: 2px 4px;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    text-decoration-color 0.2s ease;

  &:hover {
    background-color: rgba($app-primary-color, 0.08);
  }
}

:deep(.el-popper.popover-map-pin.popover-species-hint) {
  // Fixed width (the :width prop), so a long button leaves too little room on the right
  // and the popover flips to the top instead of shrinking into the gap.
  // popover-map-pin sets min-width: max-content, which would override the width.
  min-width: 0;
  white-space: normal;
  color: $text-color;
  font-weight: normal;
}

.equivalent-cell-item {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 14px 14px;
  text-align: left;
  background-color: $app-primary-color;
  border-color: $app-primary-color;
  color: #fff;

  &:hover {
    color: #fff !important;
    background-color: #ac76c5 !important;
    border: 1px solid #ac76c5 !important;

    .species-tag {
      background-color: #c799dd !important;
    }
  }

  .species-tag {
    color: #fff !important;
    background-color: #ac76c5 !important;
    border: 0 none !important;
  }
}

.species-tag {
  padding: 0 6px;
  border: 1px solid $lineColor1;
  border-radius: 10px;
  background-color: $background;
  color: $mediumGrey;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;

  &.species-tag--other {
    border-color: rgba($app-primary-color, 0.4);
    background-color: rgba($app-primary-color, 0.08);
    color: $app-primary-color;
    font-weight: 500;
  }
}
</style>
