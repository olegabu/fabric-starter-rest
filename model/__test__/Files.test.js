const Files = require('../Files')

describe("merging files (array of FormData objects)", () => {

    test(" two non-overlapped arrays should be merged ", () => {
        const files1 = [{fieldname: "f1", other: "v1"}, {fieldname: 'f2', other: 'v2'}]
        const files2 = [{fieldname: "f3", other: "v3"}, {fieldname: "f4", other: "v4"},]

        const result = Files.mergedFiles(files1, files2);
        expect(result).toEqual(expect.arrayContaining([
            {fieldname: "f1", other: "v1"},
            {fieldname: 'f2', other: 'v2'},
            {fieldname: "f3", other: "v3"},
            {fieldname: 'f4', other: 'v4'}
        ]))
    })

    test(" second array should override files with same 'fieldname' ", () => {

        const files1 = [{fieldname: "f1", other: "v1"}, {fieldname: 'f2', other: 'v2'}]
        const files2 = [{fieldname: "f1", other: "v21"}]
        const result = Files.mergedFiles(files1, files2)
        expect(result).toEqual([{fieldname: "f1", other: "v21"}, {fieldname: 'f2', other: 'v2'}])
    })

})
