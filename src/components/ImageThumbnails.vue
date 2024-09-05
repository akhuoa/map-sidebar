<template>
  <div class="dataset-card-container">
    <div class="dataset-card" v-for="imageThumbnail in imageThumbnails">
      <div class="card">
        <div class="card-left">
          <!-- <ImageGallery
            v-if="!loading && discoverId"
            :datasetId="discoverId"
            :datasetVersion="version"
            :entry="entry"
            :envVars="envVars"
            :label="label"
            :datasetThumbnail="thumbnail"
            :dataset-biolucida="biolucidaData"
            :category="currentCategory"
            @card-clicked="galleryClicked"
            @datalink-clicked="galleryDatalinkClicked"
          /> -->
        </div>
        <div class="card-right">
          <div class="title">
            {{ imageThumbnail.title }}
          </div>
          <!-- TODO: to replace with different data -->
          <div class="details" v-if="imageThumbnail.details">
            {{ imageThumbnail.details }}
          </div>
          <!-- Copy to clipboard button container -->
          <div class="float-button-container">
            <!-- <CopyToClipboard :content="copyContent" /> -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { CopyToClipboard } from '@abi-software/map-utilities';
import '@abi-software/map-utilities/dist/style.css';
import ImageGallery from './ImageGallery.vue';

  export default {
    name: 'ImageThumbnails',
    components: {
      ImageGallery,
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
    mounted: function() {
      console.log('image thumbnail mounted', this.imageThumbnails)
    }
  }
</script>

<style lang="scss" scoped>
.dataset-card-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 1rem;
  overflow-y: auto;
  scrollbar-width: thin;
}

.dataset-card {
  padding-left: 5px;
  padding-right: 5px;
  position: relative;
  min-height: 17rem;
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
</style>