<template>
  <div class="contributor-item" :class="{ 'has-orcid': hasOrcid }">
    <el-popover
      placement="top-start"
      width="320"
      trigger="hover"
      popper-class="contributor-popover"
      :disabled="!hasOrcid"
      :teleported="false"
    >
      <div class="popover-content">
        <div class="popover-name">{{ contributor.name }}</div>
        <div class="popover-orcid">
          <strong>ORCID iD</strong>:
          <a :href="orcidUri" target="_blank">{{ orcidId }}</a>
        </div>
        <div class="popover-organization" v-if="contributor.organization">
          <strong>Organization</strong>: {{ contributor.organization }}
        </div>
        <div class="popover-role" v-if="contributor.role">
          <strong>Title</strong>: {{ contributor.role }}
        </div>
      </div>
      <template #reference>
        <span>{{ contributor.name }}</span>
      </template>
    </el-popover>
  </div>
</template>

<script>
export default {
  name: 'ContributorItem',

  props: {
    contributor: {
      type: Object,
      default: () => ({})
    }
  },

  computed: {
    orcidId: function () {
      return this.contributor.orcidId || ''
    },

    orcidUri: function () {
      return this.orcidId ? `https://orcid.org/${this.orcidId}` : ''
    },

    hasOrcid: function () {
      return Boolean(this.orcidId)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../assets/_variables.scss';

.contributor-item {
  display: inline;

  &.has-orcid {
    text-decoration: underline;
    color: $app-primary-color;
  }
}
</style>

<style lang="scss">
@import '../assets/_variables.scss';

.contributor-popover.el-popover {
  font-family: $font-family;
  background: #f3ecf6 !important;
  border: 1px solid $app-primary-color !important;
  border-radius: 4px !important;
  color: $grey !important;
  text-transform: none !important;
  font-weight: 400;

  .el-popper__arrow::before {
    background: #f3ecf6 !important;
    border-color: $app-primary-color !important;
    background-color: #ffffff;
  }

  .popover-content {
    line-height: inherit;
  }

  .popover-name {
    font-size: 1.3em;
    margin-bottom: 0.25em;
  }

  .popover-orcid {
    a {
      color: $app-primary-color;
      word-break: break-all;
    }
  }

  .popover-organization,
  .popover-role {
    word-break: normal;
  }
}
</style>
