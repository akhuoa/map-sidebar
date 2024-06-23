function transformKeyValueArrayToObject(data) {
  return data.values.map(valueArray =>
    data.keys.reduce((acc, key, index) => {
      acc[key] = valueArray[index];
      return acc;
    }, {})
  );
}

// remove duplicates by stringifying the objects
const removeDuplicates = function (arrayOfAnything) {
  if (!arrayOfAnything) return []
  return [...new Set(arrayOfAnything.map((e) => JSON.stringify(e)))].map((e) =>
    JSON.parse(e)
  )
}


let FlatmapQueries = function () {
  this.initialise = function (flatmapApi) {
    this.flatmapApi = flatmapApi
    this.features = []
  }

  this.pmrSQL = function () {
    let sql = 'select * from pmr_models left join pmr_metadata on exposure = entity limit 100;'
    return sql
  }


  this.flatmapQuery = function (sql) {
    const data = { sql: sql }
    return fetch(`${this.flatmapApi}knowledge/query/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then((response) => response.json())
    .catch((error) => {
      console.error('Error:', error)
    })
  }

  this.pmrSearch = function (features=[]) {
    return new Promise((resolve, reject) => {
      this.flatmapQuery(this.pmrSQL())
        .then(data => {
          const pd = this.processFlatmapData(data)
          this.setAvailableFeatures(pd)
          if (features.length > 0) {
            resolve(this.filterFlatmapData(pd, features))
          }
          resolve(pd);
        })
        .catch(reject);
    });
  }

  // filterFlatmapData filters the flatmap data based on the filters
  // pd is the processed data from the flatmap, filters is an array of entries to filter by
  this.filterFlatmapData = function (pd, filters) {
    // Line below looks for the entity of each result in the filters array
    return pd.filter(d => filters.includes(d['term']))
  }

  // setAvailableFeatures returns the available features in the flatmap for filtering
  // pd is the processed data from the flatmap
  this.setAvailableFeatures = function (pd) {
    pd.forEach((d) => {
      Object.keys(d).forEach((key) => {
        if (!this.features.includes(key)) {
          this.features.push(key)
        }
      })
    })
  }


  this.processFlatmapData = function (data) {
    // Convert the flatmap data into an array of objects
    let dataObj = transformKeyValueArrayToObject(data)

    // Only use the results with metadata
    let metadataResults = dataObj.filter(d => d.metadata)
    let metadataOnly = metadataResults.map(d => JSON.parse(d.metadata))

    // Remove duplicates
    let uniqueResults = removeDuplicates(metadataOnly)
    return uniqueResults
  }

}

export default FlatmapQueries