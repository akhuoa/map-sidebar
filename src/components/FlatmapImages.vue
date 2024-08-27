<template>
  <div class="flatmap-images">
    <div v-for="(image, i) in images" :key="i" class="card">
        <div class="card-left">
          <a href="#" class="card-image">
            <el-image :src="image.imgSrc" loading="lazy">
              <template #error>
                <div class="image-slot">Loading<span class="dot">...</span></div>
              </template>
            </el-image>
          </a>
        </div>
        <div class="card-right">
          <div class="card-title">{{ 'Image Title' }}</div>
        </div>
    </div>
  </div>
</template>

<script>
import { ElImage } from 'element-plus';
import MissingImage from '@/../assets/missing-image.svg'

const BASE64PREFIX = 'data:image/png;base64,';

export default {
  name: 'FlatmapImages',
  components: {
    ElImage,
  },
  props: {
    images: {
      type: Object,
      default: () => null,
    }
  },
  mounted: function() {
    this.images.forEach(async (image) => {
      return this.mapImage(image);
    });
  },
  watch: {
    images: function (data) {
      this.images = data.map((image) => {
        return this.mapImage(image)
      });
    },
  },
  methods: {
    mapImage: async function (image) {
      const imgSrc = await this.transformedImage(image.thumbnail);
      if (imgSrc) {
        image.imgSrc = imgSrc;
      } else {
        image.imgSrc = MissingImage;
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
    }
  }
}
</script>
<style scoped lang="scss">
.flatmap-images {
  height: 100%;
  overflow-y: auto;
  padding: 1rem;
  background-color: #f7faff;

  .card {
    display: flex;
    flex-direction: row;
    gap: 1rem;

    + .card {
      margin-top: 1rem;
    }
  }

  .card-left {

  }

  .card-right {

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

    .dot {
      animation: dot 2s infinite steps(3, start);
      overflow: hidden;
    }
  }

  .card-title {
    font-family: Asap;
    font-size: 14px;
    font-weight: bold;
    font-stretch: normal;
    font-style: normal;
    line-height: 1.5;
    letter-spacing: 1.05px;
    color: #484848;
  }
}
</style>