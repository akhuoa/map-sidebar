<template>
  <div class="history-container">
    <!-- <span v-if="reversedSearchHistory.length > 0" class="title"> Search History </span> -->
    <template v-for="(item, i) in reversedSearchHistory">
      <el-tag
        class="search-tag"
        v-if="i < 3"
        v-bind:key="i"
        @click="search(item)"
        size="large"
      >
        {{ item.search }}
      </el-tag>
    </template>
    <el-select
      v-if="reversedSearchHistory.length > 0"
      :model-value="selectValue"
      class="m-2 search-select"
      placeholder="Full search History"
      popper-class="sidebar-search-select-popper"
      @change="selectChange"
      :teleported="false"
    >
      <el-option
        v-for="(item, i) in cascaderOptions"
        :key="i"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import {
  ElTag as Tag,
  ElSelect as Select
} from 'element-plus'

import EventBus from './EventBus.js'

// remove duplicates by stringifying the objects
const removeDuplicates = function (arrayOfAnything) {
  return [...new Set(arrayOfAnything.map((e) => JSON.stringify(e)))].map((e) =>
    JSON.parse(e)
  )
}

export default {
  name: 'SearchHistory',
  components: {
    Tag,
    Select
  },
  data() {
    return {
      searchHistory: [],
      selectValue: 'Full search history',
    }
  },
  computed: {
    reversedSearchHistory: function () {
      return removeDuplicates(
        this.searchHistory
          .slice()
          .reverse()
          .filter((item) => item.search !== '')
      )
    },
    cascaderOptions: function () {
      return this.reversedSearchHistory.map((item) => {
        return {
          value: item.search,
          label: item.search,
        }
      })
    },
  },
  methods: {
    getSearchHistory() {
      if (localStorage.getItem('sparc.science-sidebar-search-history')) {
        this.searchHistory = JSON.parse(
          localStorage.getItem('sparc.science-sidebar-search-history')
        )
      } else {
        this.searchHistory = []
      }
    },
    clearSearchHistory() {
      localStorage.removeItem('sparc.science-sidebar-search-history')
      this.searchHistory = []
    },
    addSearchToHistory(filters, search) {
      filters = [] // disable filters for now
      search = search.trim() // remove whitespace
      let searchHistory = JSON.parse(
        localStorage.getItem('sparc.science-sidebar-search-history')
      )
      if (searchHistory) {
        searchHistory.push({ filters: filters, search: search })
        this.searchHistory = removeDuplicates(searchHistory)
        localStorage.setItem(
          'sparc.science-sidebar-search-history',
          JSON.stringify(searchHistory)
        )
      } else {
        localStorage.setItem(
          'sparc.science-sidebar-search-history',
          JSON.stringify([{ filters: filters, search: search }])
        )
      }
    },
    search: function (item) {
      this.$emit('search', item)
    },
    selectChange: function (value) {
      this.selectValue = value
      this.search({ search: value })
    },
  },
  mounted: function () {
    this.getSearchHistory()
    EventBus.on('search-changed', (data) => {
      this.setSearchHistory(data)
    })
  },
}
</script>

<style lang="scss" scoped>
.history-container {
  padding-bottom: 6px;
}

.search-tag.el-tag {
  margin: 0 5px 5px 0;
  cursor: pointer;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  float: left;
  background: #f9f2fc!important;
  border-color: $app-primary-color!important;
  color:$app-primary-color!important;
}

.title {
  font-size: 14px;
  font-weight: bold;
  margin-right: 5px;
  // center text vertically
  display: flex;
  align-items: center;
}

.search-select {
  float: right;
  width: 180px;
}
</style>

<style lang="scss">
.sidebar-search-select-popper {
  font-family: Asap;
  font-size: 14px;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  color: #292b66;
  max-width: 200px;
}
</style>
