<template>
  <div class="image-thumbnails-container">
    <div class="toolbar">
      <div class="filters">
        <el-tag
          v-for="(species, index) in speciesFilterTags"
          :key="index"
          type="info"
          class="tag"
          :class="{ 'active-tag': species.name === activeSpecies.name }"
          :closable="species.name === activeSpecies.name"
          @close="removeSpeciesFilterTag"
          @click="filterBySpecies(species)"
        >
          {{ species.name }} ({{ species.count }})
        </el-tag>
      </div>
      <div class="view-selector">
        <el-select
          v-model="viewOption"
          placeholder="Select view"
          popper-class="view-selector-select-popper"
        >
          <el-option
            v-for="item in viewOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
    </div>
    <div class="gallery-container" v-if="viewOption === 'gallery'">
      <Gallery :items="imageItems" :imageStyle="imageStyle" />
    </div>
    <div class="dataset-card-container" v-if="viewOption === 'list'">
      <div class="dataset-card" v-for="imageThumbnail in imageItems">
        <div class="card" :key="imageThumbnail.link">
          <div class="card-left">
            <div>
              <div
                class="card-image"
                @click="cardButtonClick(imageThumbnail)"
              >
                <el-image :src="imageThumbnail.imgSrc" loading="lazy">
                  <template #error>
                    <div class="image-slot">Loading...</div>
                  </template>
                </el-image>
              </div>
            </div>
            <div>
              <button
                class="button el-button el-button--large"
                @click="cardButtonClick(imageThumbnail)"
              >
                View {{ imageThumbnail.type }}
              </button>
            </div>
          </div>
          <div class="card-right" v-loading="imageThumbnail.loadingData">
            <div class="details">
              <a
                :href="datasetURL(imageThumbnail.id)"
                class="title"
                target="_blank"
              >
                <strong>{{ imageThumbnail.name }}</strong>
              </a>
            </div>
            <div class="details">
              {{ imageThumbnail.contributors }}
              {{ imageThumbnail.publishYear ? `(${imageThumbnail.publishYear})` : '' }}
            </div>
            <div class="details">{{ imageThumbnail.samples }}</div>
            <!-- Copy to clipboard button container -->
            <div class="float-button-container">
              <CopyToClipboard :content="getCopyContent(imageThumbnail)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  ElImage,
  ElTag as Tag,
  ElOption as Option,
  ElSelect as Select,
} from 'element-plus';
import { CopyToClipboard } from '@abi-software/map-utilities';
import '@abi-software/map-utilities/dist/style.css';
import Gallery from "@abi-software/gallery";
import "@abi-software/gallery/dist/style.css";
import EventBus from './EventBus.js'

const BASE64PREFIX = 'data:image/png;base64,';
const VIEW_OPTIONS = [
  {
    value: 'list',
    label: 'List'
  },
  {
    value: 'gallery',
    label: 'Gallery'
  }
];

  export default {
    name: 'ImageThumbnails',
    components: {
      Tag,
      Option,
      Select,
      ElImage,
      Gallery,
      CopyToClipboard,
    },
    props: {
      /**
       * The image thumbnails data to show in sidebar.
       */
       imageThumbnails: {
        type: Array,
        default: [],
      },
      envVars: {
        type: Object,
        default: () => {},
      },
    },
    data: function () {
      return {
        activeSpecies: { name: "" },
        speciesFilterTags: [],
        imageItems: [],
        showImageGallery: false,
        viewOption: 'list',
        viewOptions: VIEW_OPTIONS,
      };
    },
    computed: {
      imageStyle() {
        return {
          width: "180px",
          height: "135px",
        };
      },
    },
    mounted: function () {
      this.injectImgSrc();
      this.populateFilterTags();
      this.populateData();
      this.imageItems = this.imageThumbnails;
    },
    watch: {
      imageThumbnails: {
        handler: function (value) {
          if (value) {
            this.injectImgSrc();
            this.populateFilterTags();
            this.imageItems = this.imageThumbnails;
          }
        },
        deep: true,
      },
    },
    methods: {
      injectImgSrc: function() {
        this.imageThumbnails.forEach((imageThumbnail) => {
          return this.mapImage(imageThumbnail);
        });
      },
      formattedTitle: function(imageThumbnail) {
        const type = imageThumbnail.mimetype?.split('/')[1];
        const title = imageThumbnail.title;
        let formattedTitle = '';
        if (type !== 'jpg') {
          formattedTitle = title.replace('.' + type, '');
        }
        formattedTitle = formattedTitle.replaceAll('_', ' ');
        return formattedTitle;
      },
      datasetURL: function(id) {
        return `https://sparc.science/datasets/${id}?type=dataset`;
      },
      mapImage: async function (image) {
        const imgSrc = await this.transformedImage(image.thumbnail);
        if (imgSrc) {
          image.imgSrc = imgSrc;
        }
      },
      transformedImage: async function(imgUrl) {
        try {
          const response = await fetch(imgUrl);
          if (!response.ok) {
            return null;
          }
          const data = await response.text();
          return BASE64PREFIX + data;
        } catch (error) {
          return null;
        }
      },
      removeSpeciesFilterTag: function () {
        this.activeSpecies = { name: "" };
        this.imageItems = this.imageThumbnails;
      },
      filterBySpecies: function (tagInfo) {
        this.activeSpecies = tagInfo;
        let filteredImageItems = [];
        this.imageThumbnails.forEach((image) => {
          if (image.species && image.species.length) {
            image.species.forEach((species) => {
              if (species === tagInfo.name) {
                filteredImageItems.push(image);
              }
            });
          }
        });
        this.imageItems = filteredImageItems;
      },
      populateData: function () {
        const requests = [];
        this.imageThumbnails.forEach((imageThumbnail) => {
          const id = imageThumbnail.id;
          const version = imageThumbnail.version;
          const key = `${id}-${version}`;
          imageThumbnail['loadingData'] = true;

          const existingReqest = requests.find((item) => item.key === key);
          if (existingReqest) {
            existingReqest.api.then((response) => this.bindData(response, imageThumbnail));
          } else {
            const newRequest = {
              key: key,
              api: this.fetchData(id, version)
            };
            newRequest.api.then((response) => this.bindData(response, imageThumbnail));
            requests.push(newRequest);
          }
        });
      },
      bindData: function (response, imageThumbnail) {
        const name = response.name;
        const contributors = response.contributors;
        const versionPublishedAt = response.versionPublishedAt;
        const species = imageThumbnail.species;
        const sample = response.modelCount.find((m) => m.modelName === 'sample');
        const subject = response.modelCount.find((m) => m.modelName === 'animal_subject');
        const numberSamples = sample ? sample.count : 0;
        const numberSubjects = subject ? subject.count : 0;
        const formattedContributors = this.getContributors(contributors);
        const publishYear = this.getPublishYear(versionPublishedAt);
        const samples = this.getSamples(species, numberSamples, numberSubjects);

        imageThumbnail['name'] = name;
        imageThumbnail['contributors'] = formattedContributors;
        imageThumbnail['publishYear'] = publishYear;
        imageThumbnail['samples'] = samples;
        imageThumbnail['loadingData'] = false;
      },
      fetchData: async function (id, version) {
        const apiLocation = this.envVars.API_LOCATION;
        const url = apiLocation + `sim/dataset/${id}/versions/${version}`;
        try {
          const response = await fetch(url);
          const json = await response.json();
          return json;
        } catch (error) {
          console.log('data fetching error', error)
        }
      },
      fetchBiolucidaData: async function (id) {
        const apiLocation = this.envVars.API_LOCATION;
        const url = apiLocation + 'image_search/' + id;
        try {
          const response = await fetch(url);
          const json = await response.json();
          return json;
        } catch (error) {
          console.warn('Biolucida data fetching error', error)
        }
      },
      // TODO: This function is from DatasetCard
      getContributors: function (contributors) {
        let text = ''
        if (contributors) {
          if (contributors.length === 1) {
            text = contributors[0].lastName;
          } else if (contributors.length === 2) {
            text =
            contributors[0].lastName +
              ' & ' +
              contributors[1].lastName
          } else if (contributors.length > 2) {
            text = contributors[0].lastName + ' et al.'
          }
        }
        return text;
      },
      // TODO: This function is from DatasetCard
      getSamples: function (species, numberSamples, numberSubjects) {
        let text = ''
        if (species) {
          text = `${species}`
        }
        if (numberSamples > 0) {
          text += ' ('
          if (numberSamples === 1) {
            text += `${numberSamples} sample`
          } else if (numberSamples > 1) {
            text += `${numberSamples} samples`
          }
          if (numberSubjects === 1) {
            text += ` from ${numberSubjects} subject`
          } else if (numberSamples > 1) {
            text += ` from ${numberSubjects} subjects`
          }
          text += ')'
        }

        return text
      },
      // TODO: This function is from DatasetCard
      getPublishYear: function (publishDate) {
        return publishDate.split('-')[0]
      },
      populateFilterTags: function () {
        let imageObjects = {};
        this.imageThumbnails.forEach((image) => {
          if (image.species && image.species.length) {
            image.species.forEach((species) => {
              if (!(species in imageObjects)) {
                imageObjects[species] = {
                  name: species,
                  count: 0,
                };
              }
              imageObjects[species].count++;
            });
          }
        });
        this.speciesFilterTags = Object.values(imageObjects);
      },
      cardButtonClick: function (imageThumbnail) {
        const id = imageThumbnail.id;
        const biolucidaData = this.fetchBiolucidaData(id);

        biolucidaData.then((data) => {
          if (data.status === 'success') {
            const biolucidaImage = data.dataset_images.find((datasetImg) =>
              datasetImg.image_id === imageThumbnail.biolucida_id
            );

            if (biolucidaImage) {
              // TODO: to update label and name
              const dataToEmit = {
                "label": imageThumbnail.name,
                "name": imageThumbnail.name,
                "datasetId": id,
                "title": "View " + imageThumbnail.type,
                "type": "Biolucida",
                "resource": {
                    "share_link": biolucidaImage.share_link,
                    "id": biolucidaImage.image_id,
                    "itemId": biolucidaImage.sourcepkg_id,
                }
              };
              this.propogateCardAction(dataToEmit);
            } else {
              console.warn('Image not found!', data);
            }

          }
        });
      },
      // TODO: This function is from DatasetCard
      propogateCardAction: function (action) {
        EventBus.emit('PopoverActionClick', action)
        EventBus.emit('contextUpdate', action) // Pass to mapintegratedvuer
      },
      getCopyContent: function (imageThumbnail) {
        const contentArray = [];

        // Use <div> instead of <h1>..<h6> or <p>
        // to avoid default formatting on font size and margin

        // Title
        if (imageThumbnail.name) {
          contentArray.push(`<div><strong>${imageThumbnail.name}</strong></div>`);
        }

        // Contributors and Publish Date
        if (imageThumbnail.contributors) {
          let details = imageThumbnail.contributors;

          if (imageThumbnail.publishYear) {
            details += ` (${imageThumbnail.publishYear})`;
          }
          contentArray.push(`<div>${details}</div>`);
        }

        // samples
        if (imageThumbnail.samples) {
          contentArray.push(`<div>${imageThumbnail.samples}</div>`);
        }

        // Type
        if (imageThumbnail.type) {
          let imageType = `<div><strong>Type:</strong></div>`;
          imageType += `\n`;
          imageType += `${imageThumbnail.type}`;
          contentArray.push(`<div>${imageType}</div>`);
        }

        // Species
        if (imageThumbnail.species?.length) {
          let species = `<div><strong>Species:</strong></div>`;
          species += `\n`;
          species += imageThumbnail.species.join(', ');
          contentArray.push(`<div>${species}</div>`);
        }

        // Image URL
        if (imageThumbnail.link) {
          let thumbnailLink = `<div><strong>Link:</strong></div>`;
          thumbnailLink += `\n`;
          thumbnailLink += `<a href="${imageThumbnail.link}">${imageThumbnail.link}</a>`;
          contentArray.push(`<div>${thumbnailLink}</div>`);
        }

        // Dataset ID
        if (imageThumbnail.id) {
          let datasetIdContent = `<div><strong>Dataset ID:</strong></div>`;
          datasetIdContent += `\n`;
          datasetIdContent += `${imageThumbnail.id}`;
          contentArray.push(`<div>${datasetIdContent}</div>`);
        }

        // Dataset URL
        if (imageThumbnail.id) {
          const datasetURL = this.datasetURL(imageThumbnail.id);
          let dataLocationContent = `<div><strong>Dataset URL:</strong></div>`;
          dataLocationContent += `\n`;
          dataLocationContent += `<a href="${datasetURL}">${datasetURL}</a>`;
          contentArray.push(`<div>${dataLocationContent}</div>`);
        }

        // Dataset version
        if (imageThumbnail.version) {
          let versionContent = `<div><strong>Dataset version:</strong></div>`;
          versionContent += `\n`;
          versionContent += `${imageThumbnail.version}`;
          contentArray.push(`<div>${versionContent}</div>`);
        }

        const copyContent = contentArray.join('\n\n<br>');
        return copyContent;
      },
    },
  }
</script>

<style lang="scss" scoped>
.image-thumbnails-container {
  font-size: 14px;
  text-align: left;
  line-height: 1.5em;
  font-family: $font-family;
  font-weight: 400;
  background-color: #f7faff;
  border-left: 1px solid var(--el-border-color);
  border-top: 1px solid var(--el-border-color);
  display: flex;
  flex-direction: column;
  height: calc(100% - 30px); // minus tabs height
  z-index: 1;
}

.toolbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  gap: 1rem;
  background-color: #f7faff;
  position: sticky;
  top: 0;
  z-index: 1;
}

.filters {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 5px;

  .tag {
    cursor: pointer;
  }
}

.view-selector .el-select {
  width: 100px;
  font-family: $font-family;
}

.gallery-container,
.dataset-card-container {
  margin: 1rem;
  margin-top: 0;
  padding: 1rem;
  flex-grow: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  border: solid 1px #e4e7ed;
  background-color: #ffffff;
  border-radius: var(--el-border-radius-base);
}

.gallery-container {
  :deep(.gallery) {
    .gallery-strip {
      padding: 1rem 0;
    }

    > div {
      min-height: max-content !important;
    }
  }
}

.dataset-card-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dataset-card {
  position: relative;

  + .dataset-card {
    padding-top: 1.5rem;
    border-top: 1px solid var(--el-border-color);
  }
}

.card {
  position: relative;
  display: flex;
  gap: 1.5rem;
}

.card-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
}

.card-right {
  flex: 1.3;
  padding-left: 6px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-image {
  display: block;
  text-decoration: none;
  outline: none;

  .el-image {
    display: block;
    width: 200px;
    height: 150px;

    :deep(img) {
      aspect-ratio: 4/3;
      object-fit: cover;
    }
  }

  .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }
}

.loading-icon {
  z-index: 20;
  width: 40px;
  height: 40px;
  left: 80px;
}

.loading-icon :deep(.el-loading-mask) {
  background-color: rgba(117, 190, 218, 0) !important;
}

.loading-icon :deep(.el-loading-spinner .path) {
  stroke: $app-primary-color;
}

.title {
  font-family: $font-family;
  font-size: 14px;
  font-weight: bold;
  font-stretch: normal;
  font-style: normal;
  line-height: 1.5;
  letter-spacing: 1.05px;
  text-decoration: none;
  color: #484848;
}

.details {
  font-family: $font-family;
  font-size: 14px;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  line-height: 1.5;
  letter-spacing: 1.05px;
  color: #484848;
}

.active-tag {
  background-color: $app-primary-color;
  color: #fff;
}

.button {
  margin-left: 0px !important;
  margin-top: 0px !important;
  font-size: 14px !important;
  letter-spacing: initial;
  background-color: $app-primary-color;
  color: #fff;

  & + .button {
    margin-top: 10px !important;
  }
  &:hover {
    color: #fff !important;
    background: #ac76c5 !important;
    border: 1px solid #ac76c5 !important;
  }
}

.float-button-container {
  position: absolute;
  bottom: 0;
  right: 0;
  opacity: 0;
  visibility: hidden;

  .dataset-card:hover & {
    opacity: 1;
    visibility: visible;
  }
}
</style>

<style lang="scss">
  .view-selector-select-popper {
    font-family: $font-family;
    font-size: 14px;
    color: #292b66;

    .el-select-dropdown__item.is-selected {
      color: $app-primary-color;
    }
  }
</style>