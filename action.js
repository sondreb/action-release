require('child_process')
    .execSync(
        'npm install @actions/core @actions/github conventional-changelog-cli mime',
        { cwd: __dirname }
    );

const fs = require('fs');
const path = require('path');
const mime = require('mime');
const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
    try {
        const api = new github.GitHub(core.getInput('token'));
        const tag = core.getInput('tag');
        const name = core.getInput('name');
        const body = core.getInput('body');
        const verbose = core.getInput('verbose');
        const draft = core.getInput('draft');
        const draft2 = core.getInput('draft2');
        const prerelease = core.getInput('prerelease');
        const files = core.getInput('files').split(';');

        console.log('draft2:');
        console.log(draft2);

        if (draft == null) {
            draft = false;
        }

        if (prerelease == null) {
            prerelease = false;
        }

        let release = null;

        function log(name, text) {
            if (verbose) {
                console.log(name + ':', text);
            }
        }

        function getFile(filePath) {
            return {
                name: path.basename(filePath),
                mime: mime.getType(filePath) || 'application/octet-stream',
                size: fs.lstatSync(filePath).size,
                file: fs.readFileSync(filePath)
            }
        }

        //log(github.context);
        //log('github', github);

        // First let us try to get the release.
        try {
            release = await api.repos.getReleaseByTag({
                ...github.context.repo,
                tag: tag
            });

            log('Tag exists', release);
        }
        catch (error) {
            if (error.name != 'HttpError' || error.status != 404) {
                throw error;
            }
        }

        if (release) {

            console.log('release.date:');
            console.log(release.data);

            // If this has been published, we'll create a new tag.
            if (draft && !release.data.draft) {
                release = null;
                log('The existing release was not draft, creating new draft...');
            }
            else {
                // We cannot update assets on existing releases, so until a future update, we'll ignore updating
                // releases that are published.
                console.log('Draft parameter is set to false and there is an existing release. Skipping any updates to release.');
                return;
            }
        }

        // Get releases if the first release get was not satisfactory.
        try {
            var releases = await api.repos.listReleases({
                ...github.context.repo
            });

            log('releases', releases);

            for (const r in releases) {
                if (r.tag_name == tag && r.draft == draft && r.prerelease == prerelease) {
                    release = r;
                    log('Release', 'Found existing release based on searching.');
                    break;
                }
            }
        }
        catch (error) {
            console.error('Failed to get releases', error);

            if (error.name != 'HttpError' || error.status != 404) {
                throw error;
            }
        }


        // Create a release if it doesn't already exists.
        if (!release) {
            var releaseOptions = {
                ...github.context.repo,
                tag_name: tag,
                target_commitish: 'master',
                //target_commitish: github.context.sha,
                name,
                body,
                prerelease: prerelease.toString(),
                draft: draft.toString()
            };

            log('releaseOptions', releaseOptions);

            release = await api.repos.createRelease(releaseOptions);
        }


        function upload() {
            var file = files.pop();

            if (!file) {
                return;
            }

            var fileInfo = getFile(file);

            return api.repos.uploadReleaseAsset({
                url: release.data.upload_url,
                headers: {
                    ['content-type']: fileInfo.mime,
                    ['content-length']: fileInfo.size
                },
                name: fileInfo.name,
                file: fileInfo.file
            }).then(() => {
                upload();
            });
        }

        upload();
    } catch (error) {
        console.error(error);
        core.setFailed(error.message);
    }
})();