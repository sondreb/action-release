var parseChangelog = require('changelog-parser');

parseChangelog(
    {
        filePath: 'CHANGELOG.md',
        removeMarkdown: false
    }
)
    .then(function (result) {
        // changelog object
        console.log(result)

    })
    .catch(function (err) {
        console.error(err);
    });

