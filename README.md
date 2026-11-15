# Lift Log

A minimal workout tracker. Log exercises, read form tips, track your progress and keep notes.

## Features
- **Train**: start a workout, add exercises, log weight × reps per set. It shows what you did last time, and a timer runs while you train. You can also repeat a past workout.
- **Rest timer**: starts on its own when you log a set's reps, or tap **Rest**. Adjust ±15s or skip. It beeps and vibrates when time is up and keeps running if you reload. Choose 1:00, 1:30, 2:00 or 3:00 in Settings, or turn off auto-start.
- **Templates**: save a routine like "Push day" (exercises plus number of sets) and start it with one tap. Weights are pre-filled from your last session. Create one from scratch, from a workout in progress, or from any past workout.
- **Motivation**: cheering messages when you have one set left on an exercise, when you finish an exercise, and a celebration screen (with time, sets, weight lifted and any PRs) when you finish a workout. Each moment has its own pool of phrases in `phrases.js`, which you can edit. You can turn them off in Settings.
- **Exercises**: 39 built-in exercises (plenty of lower body) with form tips, grouped by muscle. Add your own exercises, edit the tips, and keep personal notes on each one (cues, machine settings, grip).
- **Progress**: total workouts, workouts this week, week streak, volume over the last 30 days, a weekly frequency chart, an estimated 1-rep-max trend per exercise, best sets and full history.
- **Body weight**: log your weight in the Progress tab and see the trend and your 30-day change. One entry per day; logging again the same day replaces it.
- **Notes**: a journal for free-form notes. It also collects your workout notes and exercise notes in one place.
- Light, dark and pink themes, kg or lb, JSON backup export and import.
- PRs are detected when you finish a workout.

## Run it
No build step and no dependencies. Serve the folder with any static server:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

To use it on your phone, host it (for example with GitHub Pages: Settings → Pages → deploy from this branch). Then open it in your phone browser and choose "Add to Home Screen". It works offline after the first visit.

## Data
Everything is stored in your browser's `localStorage` on the device. Use **Settings → Export backup** now and then, because clearing your browser data will erase it.

## Files
- `index.html`: app shell
- `style.css`: styles (light and dark themes)
- `app.js`: all app logic, views and charts (plain JS, SVG charts)
- `data.js`: built-in exercise library and form tips
- `phrases.js`: motivational phrases
- `sw.js`, `manifest.json`: installable / offline support
- `icon.svg`, `icon-*.png`: app icon (light pink dumbbell on white)
