const B2 = JSON.parse(ENV_B2)

export const authB2 = () => {
    return fetch('https://api.backblazeb2.com' + B2.apiPath + 'b2_authorize_account', {
        headers: {
            authorization: 'Basic ' + btoa(B2.keyID + ':' + B2.applicationKey)
        }
    }).then((res) => res.json())
}

export const uploadB2 = async ({ fn, body, bytes, type = 'image/png' }) => {
    const auth = await authB2()

    const upload = await fetch(auth.apiUrl + B2.apiPath + 'b2_get_upload_url', {
        method: 'POST',
        headers: {
            authorization: auth.authorizationToken,
        },
        body: JSON.stringify({ bucketId: B2.bucketId })
    }).then((res) => res.json())

    const res = await fetch(upload.uploadUrl, {
        method: 'POST',
        headers: {
            authorization: upload.authorizationToken,
            'X-Bz-File-Name': fn,
            // 'X-Bz-Content-Sha1': sha1,
            'X-Bz-Content-Sha1': 'do_not_verify',
            'Content-Type': type,
            'Content-Length': bytes,
        },
        body
    }).then((res) => res.json())

    return res
}

export const downloadB2 = async (fn, auth) => {
    if (!auth) auth = await authB2()
    const fileUrl = auth.downloadUrl + B2.filePath + fn
    const res = await fetch(fileUrl, {
        headers: {
            authorization: auth.authorizationToken,
        },
    })
    return res
}

export const deleteB2 = async (fileName) => {
    const auth = await authB2()
    const file = await downloadB2(fileName, auth)
    const fileId = file.headers.get('x-bz-file-id')

    if (fileId === null) return {} // already deleted

    const delUrl = auth.apiUrl + B2.apiPath + 'b2_delete_file_version'
    const del = await fetch(delUrl, {
        method: 'POST',
        headers: {
            authorization: auth.authorizationToken,
        },
        body: JSON.stringify({ fileName, fileId })
    }).then((res) => res.json())
    return del
}