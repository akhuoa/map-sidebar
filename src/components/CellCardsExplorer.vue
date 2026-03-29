<template>
  <el-card :body-style="bodyStyle" class="content-card">
    <template #header>
      <!-- Placeholder -->
      <div class="header">
        <span class="header-title">Cell Cards Explorer</span>
      </div>
    </template>
    <!--
    <SearchFilters>
    </SearchFilters>
    <SearchHistory>
    </SearchHistory>
    -->
    <div class="content scrollbar" v-loading="loadingCards" refs="content">

    </div>
  </el-card>
</template>

<script>
/* eslint-disable no-alert, no-console */
import {
  ElCard as Card,
} from 'element-plus'
import 'element-plus/es/components/message/style/css';
import SearchFilters from './SearchFilters.vue'
import SearchHistory from './SearchHistory.vue'
import DatasetCard from './DatasetCard.vue'
import EventBus from './EventBus.js'

export default {
  components: {
    SearchFilters,
    SearchHistory,
    DatasetCard,
    Card,
  },
  name: 'CellCardsExplorer',
  props: {
    envVars: {
      type: Object,
      default: () => {},
    },
  },
  data: function () {},
  computed: {},
  methods: {},
}
</script>

<style lang="scss" scoped>
@import '../assets/searchPopover.scss';
@import '../assets/pagination.scss';

</style>
