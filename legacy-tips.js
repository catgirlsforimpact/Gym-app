// Built-in form tips from earlier app versions (v1 and v2).
// Used once to tell built-in tips apart from tips you wrote yourself when
// the built-in tips are replaced. Not shown anywhere in the app.
const LEGACY_TIPS = {
 "squat": [
  "Bar sits on upper traps, hands just outside shoulders.",
  "Brace your core before each rep — big breath into the belly.",
  "Knees track over toes; push them out on the way down.",
  "Hit at least parallel, keep chest up and drive through mid-foot.",
  "Heels stay down. If they lift, work on ankle mobility.",
  "Hips and shoulders rise together out of the bottom.",
  "Set the bar in the rack at about armpit height so you don't tiptoe or half-squat to unrack it."
 ],
 "front-squat": [
  "Bar rests on front delts, elbows high.",
  "Stay upright — think \"elbows up\" out of the hole.",
  "Sit straight down between your heels.",
  "Use a slightly narrower stance than your back squat.",
  "Take a big breath and brace before every rep.",
  "Wrists sore? Try a cross-arm grip, or build up with goblet squats."
 ],
 "rdl": [
  "Soft knees, push hips back like closing a car door.",
  "Keep the bar dragging along your thighs.",
  "Stop when you feel a strong hamstring stretch; keep a neutral spine.",
  "Knees stay soft but mostly fixed. Bending them more turns it into a squat.",
  "Drive your hips forward to stand up; don't lean back at the top."
 ],
 "lunge": [
  "Long enough stride that front shin stays near vertical.",
  "Back knee kisses the floor softly.",
  "Push through the front heel to step forward.",
  "Go slow. Rushing cuts your range of motion.",
  "Too hard? Shorten the stride or switch to reverse lunges."
 ],
 "leg-press": [
  "Feet shoulder-width, mid-platform.",
  "Lower until hips are about to curl off the pad — no further.",
  "Don't lock out knees hard at the top.",
  "Set the seat so your knees are at about 90° at the bottom.",
  "Push through your heels.",
  "Breathe out as you press, in as you lower."
 ],
 "calf-raise": [
  "Full stretch at the bottom, pause for a second.",
  "Rise as high as possible onto the big toe.",
  "Control the lowering — no bouncing.",
  "Stand on a step so your heels can drop below it.",
  "Keep a soft bend in the knees and your torso upright."
 ],
 "hip-thrust": [
  "Upper back on bench at shoulder-blade level.",
  "Tuck chin and keep ribs down; finish with a posterior pelvic tilt.",
  "Shins vertical at the top. Squeeze glutes for a beat.",
  "Keep reps slow and controlled. No bouncing out of the bottom.",
  "New to it? Get comfortable with glute bridges first, then add a barbell."
 ],
 "deadlift": [
  "Bar over mid-foot, shins close to the bar.",
  "Pull the slack out of the bar before it leaves the floor.",
  "Push the floor away; hips and shoulders rise together.",
  "Lock out by squeezing glutes — don't lean back.",
  "Keep your lats tight (think \"squeeze your armpits\") so the bar stays close.",
  "If your back starts to round, the weight is too heavy."
 ],
 "pullup": [
  "Start from a dead hang, shoulders packed down.",
  "Drive elbows down toward your hips.",
  "Chin over the bar, lower under control.",
  "Pull your chest toward the bar, not just your chin.",
  "No swinging. If you need momentum, use a band for help."
 ],
 "row": [
  "Hinge to roughly 45°, flat back.",
  "Pull the bar to your lower ribs / belly button.",
  "Lead with the elbows, squeeze shoulder blades together.",
  "Keep your torso angle fixed. If you stand up more each rep, the weight is too heavy.",
  "Keep the bar close, roughly over your mid-foot.",
  "Lower it under control along the same path."
 ],
 "lat-pulldown": [
  "Slight lean back, chest up.",
  "Pull the bar to your upper chest, not behind the neck.",
  "Let the shoulders fully reach up on each rep.",
  "Start each rep by pulling your shoulder blades down, then bend the arms.",
  "Don't lean far back. That turns it into a row.",
  "Take 2–3 seconds to let the bar back up."
 ],
 "cable-row": [
  "Sit tall, don't rock with the torso.",
  "Pull handle to your stomach, elbows close.",
  "Pause and squeeze before returning.",
  "Keep your shoulders down, away from your ears.",
  "If you're swaying, the weight is too heavy."
 ],
 "bench": [
  "Shoulder blades pinched back and down, slight arch.",
  "Feet planted, drive through the floor.",
  "Lower to lower chest with elbows ~45–70° from torso.",
  "Press up and slightly back toward your face.",
  "Touch the chest and press. Don't bounce the bar.",
  "Keep your forearms vertical at the bottom."
 ],
 "incline-db": [
  "Bench at 30–45°.",
  "Lower dumbbells to upper chest with a deep stretch.",
  "Press up in a slight arc, don't clang them together.",
  "Keep forearms vertical; don't let the elbows drift in or out.",
  "Use the full range: lower all the way, press to full extension.",
  "Moderate weight for 10–20 reps works well here."
 ],
 "pushup": [
  "Body in one straight line from head to heels.",
  "Hands just outside shoulders, elbows at ~45°.",
  "Chest touches the floor every rep."
 ],
 "dip": [
  "Lean slightly forward for chest, stay upright for triceps.",
  "Lower until shoulders are just below elbows.",
  "Keep shoulders down, away from your ears."
 ],
 "ohp": [
  "Squeeze glutes and brace — no leaning back.",
  "Bar starts on front delts, forearms vertical.",
  "Move your head back, then push it \"through the window\" at lockout.",
  "Keep wrists stacked over elbows, not bent back.",
  "Stand with feet about hip-width apart for a stable base.",
  "Fully lock out at the top."
 ],
 "lateral-raise": [
  "Slight bend in the elbows.",
  "Raise to shoulder height leading with the elbows.",
  "Go lighter than you think; control the descent.",
  "Don't shrug. Think of moving only the arms.",
  "No swinging. Momentum moves the stress into your shoulder joint."
 ],
 "face-pull": [
  "Rope at upper-chest to face height.",
  "Pull toward your forehead, hands apart.",
  "Finish with external rotation — \"double biceps\" pose."
 ],
 "curl": [
  "Elbows pinned to your sides.",
  "No swinging — if you need momentum, lower the weight.",
  "Squeeze at the top, lower slowly.",
  "Keep your wrists straight, in line with your forearms."
 ],
 "triceps-pushdown": [
  "Elbows tucked and fixed.",
  "Fully extend and squeeze at the bottom.",
  "Only the forearms move.",
  "Don't let the elbows drift forward. That brings the shoulders in.",
  "Start light and keep it strict."
 ],
 "plank": [
  "Elbows under shoulders.",
  "Squeeze glutes and pull ribs down — no sagging hips.",
  "Log seconds as \"reps\" and 0 for weight.",
  "Don't pike your hips up. Head, hips and heels stay in one line."
 ],
 "hanging-leg-raise": [
  "Start from a still dead hang.",
  "Curl the pelvis up, not just the legs.",
  "Lower slowly to avoid swinging."
 ],
 "goblet-squat": [
  "Hold the dumbbell vertically against your chest, elbows pointing down.",
  "Sit between your heels and let your elbows brush the inside of your knees.",
  "Keep your chest tall and drive up through the whole foot.",
  "Keep the weight tight to your chest so it doesn't pull you forward.",
  "Use your elbows to nudge your knees out if they cave in."
 ],
 "bulgarian-split-squat": [
  "Rear foot laces-down on a bench, front foot far enough forward that you can drop straight down.",
  "Lean the torso slightly forward for more glutes, stay upright for more quads.",
  "Lower until the back knee nearly touches the floor; push through the front heel.",
  "Do all reps on one leg, then switch.",
  "Put the front foot slightly out to the side, not in line with the back foot, for balance.",
  "Don't let the front knee cave inward.",
  "Warm up with a bodyweight set first."
 ],
 "reverse-lunge": [
  "Step back, not out to the side, and keep your hips square.",
  "Most of your weight stays on the front leg.",
  "Easier on the knees than forward lunges — good for control and balance.",
  "Lower until the front knee is at about 90° and the back knee lightly touches the floor."
 ],
 "step-up": [
  "Box height so your thigh is about parallel when your foot is on it.",
  "Drive through the heel of the top foot — don't push off the back leg.",
  "Stand fully tall at the top, then lower slowly.",
  "Step back down with control and land softly with a bent knee."
 ],
 "hack-squat": [
  "Back and hips flat against the pad the whole time.",
  "Feet lower on the platform for more quads, higher for more glutes.",
  "Go as deep as you can while keeping your heels down.",
  "Adjust the shoulder pads so they sit snugly on your shoulders.",
  "Hold the handles for stability."
 ],
 "leg-extension": [
  "Line your knee up with the machine's pivot point.",
  "Pad sits just above your ankles.",
  "Squeeze your quads hard at the top for a second, lower under control."
 ],
 "leg-curl": [
  "Knee lined up with the machine's pivot; hips pressed into the pad.",
  "Curl all the way, squeeze, then lower slowly — the lowering builds the most.",
  "Don't let your hips lift to cheat the weight up.",
  "Pull your toes toward your shins for a full range of motion."
 ],
 "nordic-curl": [
  "Anchor your ankles under something solid, kneel on a pad.",
  "Keep a straight line from knees to head — don't bend at the hips.",
  "Lower as slowly as you can, catch yourself with your hands, push back up.",
  "Use a band around your hips for help until you're stronger.",
  "Only go as low as you can control."
 ],
 "sumo-deadlift": [
  "Wide stance, toes turned out, hands inside your legs.",
  "Push your knees out over your toes and keep your chest up.",
  "Think \"spread the floor\" as you drive up; lock out with your glutes.",
  "Take the slack out of the bar before you pull. Don't relax at the bottom.",
  "Screw your feet into the floor to keep your knees from caving.",
  "If your hips shoot up first, push with your legs instead."
 ],
 "single-leg-rdl": [
  "Soft knee on the standing leg, hips stay level — don't let one open up.",
  "Reach the free leg back as the torso tips forward, like a seesaw.",
  "Go slow; balance is part of the exercise.",
  "Don't lock the standing leg straight.",
  "If balance is hard, learn the staggered-stance RDL first."
 ],
 "good-morning": [
  "Bar on your upper back like a squat, knees slightly bent.",
  "Push your hips back with a flat back until you feel the hamstrings.",
  "Start light — this is about the stretch, not heavy weight.",
  "Keep the bar fixed on your back. It shouldn't drift.",
  "A barbell uncomfortable? Hold a dumbbell at your chest instead."
 ],
 "glute-bridge": [
  "Lie on your back, feet flat, heels about a hand's length from your glutes.",
  "Push through your heels and lift your hips until body forms a straight line.",
  "Squeeze at the top for two seconds; don't arch your lower back.",
  "Brace by gently pressing your lower back into the floor before you lift."
 ],
 "cable-kickback": [
  "Ankle strap on, hinge forward slightly and hold the machine.",
  "Kick back and slightly out, keeping the leg nearly straight.",
  "Stop before your lower back arches; squeeze the glute at the end.",
  "Keep your hips square, hip bones pointing forward.",
  "Control the return. Don't let the cable yank your leg forward."
 ],
 "hip-abduction": [
  "Sit tall, or lean forward slightly to target the upper glutes more.",
  "Push the pads out with control and pause at the widest point.",
  "Don't let the weights slam on the way back."
 ],
 "hip-adduction": [
  "Start with a comfortable stretch — don't force the range at first.",
  "Squeeze the pads together and pause.",
  "Return slowly; keep your back against the seat.",
  "Set the pads on your inner thighs, just above the knees.",
  "Don't let the weight stack touch down between reps.",
  "Moderate weight for 12–20 reps works best."
 ],
 "frog-pump": [
  "Lie on your back, soles of the feet together, knees out wide.",
  "Thrust your hips up, squeezing your glutes hard at the top.",
  "High reps work well — 20 to 30 per set.",
  "Keep reps slow and deliberate.",
  "Once bodyweight is easy, add a band or a dumbbell on your hips."
 ]
};
