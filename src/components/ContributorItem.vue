<template>
  <div class="contributor-item" :class="{ 'has-orcid': hasOrcid }">
    <el-popover
      placement="top-start"
      width="320"
      trigger="hover"
      popper-class="contributor-popover"
      :disabled="!hasOrcid"
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
.contributor-item {
  display: inline;

  &.has-orcid {
    text-decoration: underline;
    color: #8300bf;
    cursor: pointer;
  }
}
</style>
<style lang="scss">
.contributor-popover {
  .popover-content {
    line-height: 1.6;
  }

  .popover-name {
    font-size: 1.15em;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .popover-orcid {
    margin-bottom: 0.4em;

    a {
      color: #8300bf;
      word-break: break-all;
    }
  }

  .popover-organization,
  .popover-role {
    margin-bottom: 0.25em;
    word-break: normal;
  }
}
</style>
