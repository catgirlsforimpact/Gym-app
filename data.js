// Built-in exercise library with form tips.
// Users can edit tips / add their own exercises in the app.
const DEFAULT_EXERCISES = [
  { id: 'squat', name: 'Back Squat', group: 'Legs', tips: [
    'Bar sits on upper traps, hands just outside shoulders.',
    'Brace your core before each rep — big breath into the belly.',
    'Knees track over toes; push them out on the way down.',
    'Hit at least parallel, keep chest up and drive through mid-foot.' ] },
  { id: 'front-squat', name: 'Front Squat', group: 'Legs', tips: [
    'Bar rests on front delts, elbows high.',
    'Stay upright — think "elbows up" out of the hole.',
    'Sit straight down between your heels.' ] },
  { id: 'rdl', name: 'Romanian Deadlift', group: 'Legs', tips: [
    'Soft knees, push hips back like closing a car door.',
    'Keep the bar dragging along your thighs.',
    'Stop when you feel a strong hamstring stretch; keep a neutral spine.' ] },
  { id: 'lunge', name: 'Walking Lunge', group: 'Legs', tips: [
    'Long enough stride that front shin stays near vertical.',
    'Back knee kisses the floor softly.',
    'Push through the front heel to step forward.' ] },
  { id: 'leg-press', name: 'Leg Press', group: 'Legs', tips: [
    'Feet shoulder-width, mid-platform.',
    'Lower until hips are about to curl off the pad — no further.',
    'Don\'t lock out knees hard at the top.' ] },
  { id: 'calf-raise', name: 'Calf Raise', group: 'Legs', tips: [
    'Full stretch at the bottom, pause for a second.',
    'Rise as high as possible onto the big toe.',
    'Control the lowering — no bouncing.' ] },
  { id: 'hip-thrust', name: 'Hip Thrust', group: 'Glutes', tips: [
    'Upper back on bench at shoulder-blade level.',
    'Tuck chin and keep ribs down; finish with a posterior pelvic tilt.',
    'Shins vertical at the top. Squeeze glutes for a beat.' ] },
  { id: 'deadlift', name: 'Deadlift', group: 'Back', tips: [
    'Bar over mid-foot, shins close to the bar.',
    'Pull the slack out of the bar before it leaves the floor.',
    'Push the floor away; hips and shoulders rise together.',
    'Lock out by squeezing glutes — don\'t lean back.' ] },
  { id: 'pullup', name: 'Pull-up', group: 'Back', tips: [
    'Start from a dead hang, shoulders packed down.',
    'Drive elbows down toward your hips.',
    'Chin over the bar, lower under control.' ] },
  { id: 'row', name: 'Barbell Row', group: 'Back', tips: [
    'Hinge to roughly 45°, flat back.',
    'Pull the bar to your lower ribs / belly button.',
    'Lead with the elbows, squeeze shoulder blades together.' ] },
  { id: 'lat-pulldown', name: 'Lat Pulldown', group: 'Back', tips: [
    'Slight lean back, chest up.',
    'Pull the bar to your upper chest, not behind the neck.',
    'Let the shoulders fully reach up on each rep.' ] },
  { id: 'cable-row', name: 'Seated Cable Row', group: 'Back', tips: [
    'Sit tall, don\'t rock with the torso.',
    'Pull handle to your stomach, elbows close.',
    'Pause and squeeze before returning.' ] },
  { id: 'bench', name: 'Bench Press', group: 'Chest', tips: [
    'Shoulder blades pinched back and down, slight arch.',
    'Feet planted, drive through the floor.',
    'Lower to lower chest with elbows ~45–70° from torso.',
    'Press up and slightly back toward your face.' ] },
  { id: 'incline-db', name: 'Incline Dumbbell Press', group: 'Chest', tips: [
    'Bench at 30–45°.',
    'Lower dumbbells to upper chest with a deep stretch.',
    'Press up in a slight arc, don\'t clang them together.' ] },
  { id: 'pushup', name: 'Push-up', group: 'Chest', tips: [
    'Body in one straight line from head to heels.',
    'Hands just outside shoulders, elbows at ~45°.',
    'Chest touches the floor every rep.' ] },
  { id: 'dip', name: 'Dip', group: 'Chest', tips: [
    'Lean slightly forward for chest, stay upright for triceps.',
    'Lower until shoulders are just below elbows.',
    'Keep shoulders down, away from your ears.' ] },
  { id: 'ohp', name: 'Overhead Press', group: 'Shoulders', tips: [
    'Squeeze glutes and brace — no leaning back.',
    'Bar starts on front delts, forearms vertical.',
    'Move your head back, then push it "through the window" at lockout.' ] },
  { id: 'lateral-raise', name: 'Lateral Raise', group: 'Shoulders', tips: [
    'Slight bend in the elbows.',
    'Raise to shoulder height leading with the elbows.',
    'Go lighter than you think; control the descent.' ] },
  { id: 'face-pull', name: 'Face Pull', group: 'Shoulders', tips: [
    'Rope at upper-chest to face height.',
    'Pull toward your forehead, hands apart.',
    'Finish with external rotation — "double biceps" pose.' ] },
  { id: 'curl', name: 'Biceps Curl', group: 'Arms', tips: [
    'Elbows pinned to your sides.',
    'No swinging — if you need momentum, lower the weight.',
    'Squeeze at the top, lower slowly.' ] },
  { id: 'triceps-pushdown', name: 'Triceps Pushdown', group: 'Arms', tips: [
    'Elbows tucked and fixed.',
    'Fully extend and squeeze at the bottom.',
    'Only the forearms move.' ] },
  { id: 'plank', name: 'Plank', group: 'Core', tips: [
    'Elbows under shoulders.',
    'Squeeze glutes and pull ribs down — no sagging hips.',
    'Log seconds as "reps" and 0 for weight.' ] },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', group: 'Core', tips: [
    'Start from a still dead hang.',
    'Curl the pelvis up, not just the legs.',
    'Lower slowly to avoid swinging.' ] },
];
