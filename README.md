# Primary schools scraper

## Prerequisities

Node.js installed with `npm` package manager.

Run `build.bat` script to install required dependencies.

## Input

Set your input configuration of `schools-scraper` in the generated `INPUT.json` file located in `apify_storage/key_value_stores/default` directory. Example input:

```json
{
  "regionUrls": [
    {
      "url": "http://www.schulliste.eu/type/grundschulen/?bundesland=sachsen"
    }
  ],
  "subRegionNames": [
    "Leipzig"
  ]
}
```

## Run

Invoke `run.bat` script or run `apify run -p` directly. `-p` flag stands for `--purge` and it's needed to clean previous crawling state properly.

## Output

See `apify_storage/datasets` directory with json files representing the individual scraped results.
