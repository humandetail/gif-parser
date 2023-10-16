export const readFile = async (source: string | File) => {
  const blob = typeof source === 'string'
    ? await getBlobByURL(source)
    : new Blob([source], { type: source.type })

  const dataView = await getDataView(blob)

  return dataView
}

const getBlobByURL = (url: string) => {
  return fetch(url)
    .then(response => {
      if (response.ok) {
        return response.blob()
      } else {
        throw response
      }
    })
}

function getDataView (blob: Blob) {
  return new Promise<DataView>((resolve, reject) => {
    const fd = new FileReader()

    fd.onload = (event: ProgressEvent<FileReader>) => {
      const buffer = event.target!.result as ArrayBuffer

      const dataView = new DataView(buffer)

      resolve(dataView)
    }
    fd.onerror = () => {
      reject(new Error('Unable to transfer blob to data view.'))
    }

    fd.readAsArrayBuffer(blob)
  })
}
