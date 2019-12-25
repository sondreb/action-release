# action-release

GitHub Action: GitHub Release Action

## What this does, and does not do

There are plenty of existing GitHub Actions that handles publish of releases on GitHub. This is yet another.

Use this Action if you have the following workflow:

- All commits to master should build and update a single draft release.
- When the draft is ready for release, it can be published as prerelease/release manually. It will no longer be updateable.
- On next commit, another draft release will be created.


## Usage

Here is an example on how to use this Action:

```
    - name: Release
      uses: sondreb/action-release@master
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        artifacts: "action.js"
        draft: true
        prerelease: true
        name: "Draft Release"
        tag: v0.0.1
```

## License

[MIT](LICENSE)