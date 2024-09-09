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
            <a :href="imageThumbnail.link" class="card-image card-button-link" target="_blank">
              <el-image :src="imageThumbnail.imgSrc" loading="lazy">
                <template #error>
                  <div class="image-slot">Loading...</div>
                </template>
              </el-image>
            </a>
          </div>
          <div class="card-right">
            <div class="details">
              <a class="title card-button-link" :href="imageThumbnail.link" target="_blank">
                {{ formattedTitle(imageThumbnail) }}
              </a>
            </div>
            <div class="details">
              <a class="button el-button el-button--large card-button-link" :href="datasetURL(imageThumbnail.id)" target="_blank">
                View Dataset {{ imageThumbnail.id }}
              </a>
            </div>
            <!-- Copy to clipboard button container -->
            <!-- <div class="float-button-container">
              <CopyToClipboard :content="copyContent" />
            </div> -->
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
    },
  }
</script>

<style lang="scss" scoped>
.image-thumbnails-container {
  font-size: 14px;
  text-align: left;
  line-height: 1.5em;
  font-family: Asap, sans-serif, Helvetica;
  font-weight: 400;
  background-color: #f7faff;
  border-left: 1px solid var(--el-border-color);
  border-top: 1px solid var(--el-border-color);
  display: flex;
  flex-direction: column;
  height: 100%;
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
  font-family: inherit;
}

.gallery-container,
.dataset-card-container {
  padding: 1rem;
  overflow-y: auto;
  scrollbar-width: thin;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  border: solid 1px #e4e7ed;
  border-left: 0;
  background-color: #ffffff;
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
  gap: 18px;
}

.dataset-card {
  padding-left: 5px;
  padding-right: 5px;
  position: relative;
  min-height: 12rem;
}

.card {
  position: relative;
  display: flex;
}

.card-left {
  flex: 1;
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

.title {
  padding-bottom: 0.75rem;
  font-family: Asap;
  font-size: 14px;
  font-weight: bold;
  font-stretch: normal;
  font-style: normal;
  line-height: 1.5;
  letter-spacing: 1.05px;
  color: #484848;
  cursor: pointer;
}

.details {
  font-family: Asap;
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

.card-button-link {
  text-decoration: none;
}
</style>

<style lang="scss">
  .view-selector-select-popper {
    font-family: Asap, sans-serif, Helvetica;
    font-size: 14px;
    color: #292b66;

    .el-select-dropdown__item.is-selected {
      color: $app-primary-color;
    }
  }
</style>