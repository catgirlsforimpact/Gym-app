# Source of truth for the built-in exercise library. Generates data.js.
# Tips run in order: setup -> movement -> range/tempo -> common mistake / variation.
# No rep counts in tips (the app suggests reps from the user's rep range).
import json, sys

EX = []
def ex(id, name, groups, tips, **extra):
    EX.append(dict(id=id, name=name, groups=groups, tips=tips, **extra))

# ---------------- Lower body: squat pattern ----------------
ex('squat', 'Back Squat', ['Quads', 'Glutes'], [
    "Set the bar in the rack at about armpit height so you can unrack it with a small step back.",
    "Rest the bar across your upper back, on top of the shoulder blades, not on your neck. Grip as narrow as your shoulders comfortably allow.",
    "Feet about shoulder-width, toes turned out a little. Use the stance that lets you squat deepest with a flat back.",
    "Take a big breath into your belly and brace before each rep. Breathe out at the top.",
    "Push your knees out in line with your toes. It's normal for them to travel forward past your toes.",
    "Go as deep as you can while your lower back stays neutral. Thighs at least parallel to the floor is a good target.",
    "Drive up through your whole foot with heels down, hips and chest rising together.",
])
ex('front-squat', 'Front Squat', ['Quads', 'Glutes'], [
    "Rest the bar on the front of your shoulders, close to your throat. Your shoulders hold the weight; your fingertips only keep it in place.",
    "Point your elbows forward and keep them high for the whole rep.",
    "Stand a little narrower than in your back squat, toes slightly out.",
    "Brace hard and sit straight down between your heels, staying upright.",
    "Lead with your elbows on the way up so your chest doesn't tip forward.",
    "Tight wrists? Use a cross-arm grip, or loop lifting straps around the bar and hold the straps.",
])
ex('goblet-squat', 'Goblet Squat', ['Quads', 'Glutes'], [
    "Hold a dumbbell or kettlebell against your chest with your elbows pointing down.",
    "Feet a bit wider than hip-width, toes slightly out.",
    "Sit down between your heels, keeping your chest tall and the weight close to your body.",
    "At the bottom, use your elbows to gently push your knees out.",
    "Drive up through your whole foot.",
    "Great for learning depth: go as low as you can while your back stays flat.",
])
ex('smith-squat', 'Smith Machine Squat', ['Quads', 'Glutes'], [
    "Set the bar at about shoulder height and the safety stops just below your lowest point.",
    "Step under so the bar rests across your upper back.",
    "Place your feet slightly in front of the bar so you can sit straight down. Feet further forward work the glutes more.",
    "Brace and lower as deep as you can with a flat back.",
    "Drive up through your whole foot, knees in line with your toes.",
])
ex('sumo-squat', 'Sumo Squat', ['Glutes', 'Adductors', 'Quads'], [
    "Hold a dumbbell or kettlebell between your legs with straight arms.",
    "Take a wide stance with your toes turned out.",
    "Sit straight down, pushing your knees out in line with your toes.",
    "Keep your chest up and your back flat.",
    "Stand up by squeezing your glutes and inner thighs.",
    "Standing on two low steps lets the weight go lower for a deeper stretch.",
])
ex('hack-squat', 'Hack Squat', ['Quads'], [
    "Keep your back and hips flat against the pad, shoulder pads snug.",
    "Feet about shoulder-width in the middle of the platform. Lower on the platform works the quads more.",
    "Release the safety handles and hold them for stability.",
    "Lower as deep as you can while your heels stay down and your hips stay on the pad.",
    "Press through your whole foot and stop just short of locking your knees.",
])
ex('leg-press', 'Leg Press', ['Quads', 'Glutes'], [
    "Keep your lower back and hips flat against the pad the whole time.",
    "Feet about shoulder-width in the middle of the platform. Higher feet work glutes and hamstrings more, lower feet work quads more.",
    "Lower until your knees are well bent, stopping before your hips lift or your lower back rounds off the pad.",
    "Press through your whole foot with your heels down.",
    "Keep your knees in line with your toes.",
    "Stop just short of locking your knees at the top.",
])

# ---------------- Lower body: single leg ----------------
ex('bulgarian-split-squat', 'Bulgarian Split Squat', ['Quads', 'Glutes'], [
    "Rear foot on a bench, laces down. Front foot far enough forward that you can drop straight down.",
    "Place the front foot slightly out to the side, not in line with the back foot, for balance.",
    "Lower until the back knee nearly touches the floor, front heel down.",
    "Take a longer stance and lean slightly forward for more glutes; a shorter stance and upright torso for more quads.",
    "Keep the front knee in line with your toes.",
    "Push up through the front foot. Do all reps on one leg, then switch.",
])
ex('split-squat', 'Split Squat', ['Quads', 'Glutes'], [
    "Stand in a long staggered stance with your back heel lifted.",
    "Lower straight down until the back knee nearly touches the floor.",
    "Keep most of your weight on the front foot.",
    "Front knee follows the line of your toes.",
    "Push up through the front foot without moving your feet. Do all reps, then switch.",
])
ex('lunge', 'Walking Lunge', ['Quads', 'Glutes'], [
    "Take a step long enough that both knees reach about 90° at the bottom.",
    "Lower straight down until the back knee almost touches the floor.",
    "Stay tall for more quads, or lean slightly forward for more glutes.",
    "Push through the whole front foot to step into the next rep.",
    "Keep the front knee in line with your toes; don't let it cave in.",
    "Move with control. Rushing shortens the range and costs balance.",
])
ex('reverse-lunge', 'Reverse Lunge', ['Glutes', 'Quads'], [
    "Stand tall, then step one foot straight back.",
    "Lower until the back knee lightly touches the floor and the front knee is at about 90°.",
    "Keep most of your weight on the front leg.",
    "Push through the front heel to return to standing.",
    "Easier on the knees than forward lunges, and great for glutes.",
])
ex('curtsy-lunge', 'Curtsy Lunge', ['Glutes', 'Quads'], [
    "Stand tall, then step one leg behind and across the other, like a curtsy.",
    "Lower until the back knee nearly touches the floor.",
    "Keep your hips facing forward and the front knee in line with its toes.",
    "Push through the front heel to stand back up.",
    "Go slowly. It targets the side of the glutes.",
])
ex('lateral-lunge', 'Lateral Lunge', ['Adductors', 'Glutes', 'Quads'], [
    "Stand with your feet together, then take a big step out to the side.",
    "Sit your hips back over the stepping leg, keeping the other leg straight.",
    "Keep both feet flat and pointing forward, chest up.",
    "Go as low as you can while your back stays flat.",
    "Push off the bent leg to return to the start.",
])
ex('step-up', 'Step-up', ['Quads', 'Glutes'], [
    "Use a box or bench at knee height or a little lower.",
    "Place your whole foot on the box.",
    "Drive through the heel of the top foot. Don't push off with the back leg.",
    "Stand fully tall at the top.",
    "Lower slowly and land softly.",
    "Lean slightly forward for more glutes.",
])

# ---------------- Lower body: hinge ----------------
ex('rdl', 'Romanian Deadlift', ['Hamstrings', 'Glutes'], [
    "Start standing with the bar at your hips, hands just outside your thighs, shoulders back.",
    "Soften your knees slightly and keep that bend fixed through the rep.",
    "Push your hips straight back and let the bar slide down your thighs, close to your legs.",
    "Keep your back flat and neck neutral. Your torso tips forward because your hips move back, not because your back rounds.",
    "Lower until you feel a strong hamstring stretch, usually just below the knees. How low depends on your flexibility.",
    "Squeeze your glutes to drive your hips forward and stand tall. Don't lean back at the top.",
])
ex('single-leg-rdl', 'Single-leg RDL', ['Hamstrings', 'Glutes'], [
    "Stand on one leg with a soft knee, holding the weight in the opposite hand or both hands.",
    "Hinge forward and reach the free leg straight back, like a seesaw.",
    "Keep your hips level; don't let the hip of the raised leg open up.",
    "Lower until you feel a strong hamstring stretch, back flat.",
    "Drive your hip forward to stand up. Go slowly; balance is part of it.",
    "Lightly touch a wall or rack with one hand if balance holds you back.",
])
ex('deadlift', 'Deadlift', ['Glutes', 'Hamstrings', 'Back'], [
    "Stand with the bar over the middle of your feet, feet about hip-width.",
    "Grip just outside your legs, then bend your knees until your shins touch the bar.",
    "Flatten your back, chest up, and tighten your lats by pulling your shoulders down and back.",
    "Take a big breath, brace, and pull the slack out of the bar before it leaves the floor.",
    "Push the floor away with your legs; hips and shoulders rise together and the bar stays against your legs.",
    "Finish standing tall with your glutes squeezed. Don't lean back.",
    "Lower by pushing your hips back first, then bend your knees once the bar passes them.",
    "If your back starts to round, the weight is too heavy for today.",
])
ex('sumo-deadlift', 'Sumo Deadlift', ['Glutes', 'Adductors', 'Hamstrings'], [
    "Take a wide stance with your toes turned out and your shins close to the bar.",
    "Grip the bar inside your legs with straight arms.",
    "Push your knees out over your toes and keep your chest up.",
    "Tighten your back and take the slack out of the bar, then push the floor apart with your feet.",
    "Keep the bar against your body and finish standing tall, glutes squeezed.",
    "If your hips shoot up first, think \"push with the legs\".",
])
ex('good-morning', 'Good Morning', ['Hamstrings', 'Glutes', 'Back'], [
    "Bar on your upper back like a squat, feet hip-width, soft knees.",
    "Push your hips back with a flat back until you feel a strong hamstring stretch or your torso is close to parallel.",
    "Keep the bar fixed on your back.",
    "Squeeze your glutes to stand up.",
    "Use a light weight. This is about the stretch, not heavy load.",
    "Bar uncomfortable on your back? Hold a dumbbell against your chest instead.",
])
ex('cable-pull-through', 'Cable Pull-through', ['Glutes', 'Hamstrings'], [
    "Attach a rope to a low cable, face away and hold the rope between your legs.",
    "Walk forward a couple of steps; feet a little wider than hip-width.",
    "Push your hips back with soft knees until you feel a hamstring stretch, back flat.",
    "Drive your hips forward and squeeze your glutes to stand tall.",
    "Your arms only hold the rope; your hips do the work.",
    "Don't lean back at the top.",
])
ex('kb-swing', 'Kettlebell Swing', ['Glutes', 'Hamstrings'], [
    "Stand with the kettlebell a step in front of you, feet a bit wider than your hips.",
    "Hinge, grab the handle and hike it back between your legs like a football.",
    "Snap your hips forward hard and squeeze your glutes; the bell floats up to about chest height.",
    "Your arms only guide the bell. The power comes from your hips.",
    "Let the bell fall back between your legs and hinge again. Don't turn it into a squat.",
    "Keep your back flat and stand fully tall at the top of every rep.",
])
ex('back-extension', 'Back Extension', ['Glutes', 'Hamstrings'], [
    "Set the pad just below your hip bones so you can bend freely at the hips.",
    "Turn your toes out slightly and round your upper back a little to keep the work in your glutes.",
    "Lower until you feel a stretch in your hamstrings.",
    "Rise by squeezing your glutes until your body is in a straight line.",
    "Don't swing up or arch past straight.",
    "Hold a plate or dumbbell against your chest to make it harder.",
])

# ---------------- Lower body: glute focus ----------------
ex('hip-thrust', 'Hip Thrust', ['Glutes', 'Hamstrings'], [
    "Rest your upper back on a bench just below your shoulder blades, with a pad on the bar across your hip crease.",
    "Feet flat, about hip-width, placed so your shins are vertical at the top.",
    "Tuck your chin and keep your ribs down. Look forward, not at the ceiling.",
    "Drive through your heels until your hips are fully extended and your body is flat from shoulders to knees.",
    "Squeeze your glutes hard for a second at the top and tilt your pelvis slightly under. Don't arch your lower back to get higher.",
    "Lower under control until your hips are just above the floor, then go again without bouncing.",
    "Feel it in your hamstrings? Move your feet a little closer. In your quads? Move them a little further away.",
])
ex('b-stance-hip-thrust', 'B-stance Hip Thrust', ['Glutes', 'Hamstrings'], [
    "Set up like a regular hip thrust, upper back on the bench.",
    "Move one foot forward so only its heel touches the floor. The other leg does most of the work.",
    "Keep most of your weight on the working leg.",
    "Drive through the working heel and lock your hips out at the top.",
    "Keep your hips level; don't let one side drop.",
    "Expect to use less weight than in your regular hip thrust.",
])
ex('single-leg-hip-thrust', 'Single-leg Hip Thrust', ['Glutes', 'Hamstrings'], [
    "Upper back on a bench, one foot planted, the other knee pulled up toward your chest.",
    "Drive through the planted heel until your hips are fully extended.",
    "Keep your hips level, pelvis tilted slightly under at the top.",
    "Pause and squeeze, then lower under control.",
    "Start with bodyweight; add a dumbbell on your hip when it gets easy.",
])
ex('hip-thrust-machine', 'Hip Thrust Machine', ['Glutes', 'Hamstrings'], [
    "Adjust the pad so it sits across your hip crease and your back rests on the backrest.",
    "Feet hip-width, placed so your shins are vertical at the top.",
    "Tuck your chin and keep your ribs down.",
    "Drive through your heels to full hip extension and squeeze your glutes.",
    "Lower slowly without letting the weight rest at the bottom.",
])
ex('glute-bridge', 'Glute Bridge', ['Glutes'], [
    "Lie on your back, knees bent, feet flat and hip-width apart, heels about a hand's length from your glutes.",
    "Brace by gently pressing your lower back into the floor.",
    "Push through your heels and lift your hips until your body is straight from shoulders to knees.",
    "Squeeze your glutes for a second or two at the top without arching your lower back.",
    "Lower slowly. Add a band above your knees or a weight on your hips to progress.",
])
ex('frog-pump', 'Frog Pump', ['Glutes'], [
    "Lie on your back with the soles of your feet together, knees out wide and heels close to your glutes.",
    "Thrust your hips up and squeeze your glutes hard at the top.",
    "Keep your ribs down and your lower back neutral.",
    "Keep every rep controlled; no bouncing.",
    "Add a dumbbell on your hips once bodyweight is easy.",
])
ex('cable-kickback', 'Cable Kickback', ['Glutes'], [
    "Ankle strap on, face the machine, hinge forward slightly and hold on.",
    "Keep a small bend in the working knee.",
    "Kick your leg back and slightly out to the side, squeezing your glute.",
    "Keep your hips square, hip bones pointing forward.",
    "Stop before your lower back arches; the movement comes from the hip.",
    "Return slowly. Don't let the cable pull your leg forward.",
], step=1)
ex('donkey-kick', 'Donkey Kick', ['Glutes'], [
    "Start on hands and knees, hands under your shoulders and knees under your hips.",
    "Keep one knee bent at 90° and lift that foot toward the ceiling.",
    "Stop when your thigh is in line with your body; don't arch your back.",
    "Squeeze your glute at the top, then lower with control.",
    "Add an ankle weight or a band to make it harder.",
], step=1)
ex('hip-abduction', 'Hip Abduction Machine', ['Glutes'], [
    "Sit with your back against the pad and your legs inside the pads.",
    "Push your knees out as far as you can, then pause.",
    "Lean your torso slightly forward to shift more work to the upper glutes.",
    "Return slowly; don't let the weights touch between reps.",
    "Pick a weight you can pause and squeeze at the widest point, not just push.",
])
ex('banded-lateral-walk', 'Banded Lateral Walk', ['Glutes'], [
    "Put a mini band just above your knees or around your ankles.",
    "Feet hip-width, knees slightly bent, hips back in a quarter squat.",
    "Step sideways, keeping tension on the band the whole time.",
    "Keep your toes pointing forward and never bring your feet fully together.",
    "Stay low and keep your torso still. Go both directions.",
    "Log the steps per side as reps.",
], step=1)

# ---------------- Lower body: hamstrings, adductors, calves, quads isolation ----------------
ex('leg-curl', 'Leg Curl', ['Hamstrings'], [
    "Adjust the machine so your knees line up with the pivot point and the pad sits just above your heels.",
    "Keep your hips pressed into the pad or seat.",
    "Curl your heels toward your glutes as far as you can.",
    "Pull your toes toward your shins for a stronger squeeze.",
    "Lower slowly; the way down builds a lot of hamstring.",
    "Don't let your hips lift to swing the weight up.",
])
ex('ball-leg-curl', 'Stability Ball Leg Curl', ['Hamstrings', 'Glutes'], [
    "Lie on your back with your heels on a stability ball.",
    "Lift your hips into a bridge.",
    "Keep your hips up and curl the ball toward you with your heels.",
    "Pause, then roll the ball back out slowly without dropping your hips.",
    "Too easy? Do it one leg at a time.",
])
ex('nordic-curl', 'Nordic Curl', ['Hamstrings'], [
    "Kneel on a pad with your ankles anchored under something solid or held by a partner.",
    "Keep a straight line from knees to head; don't bend at the hips.",
    "Lower yourself forward as slowly as you can.",
    "Catch yourself with your hands when you can't hold it any more, then push back up.",
    "It's very hard. Start with a few reps, or loop a band from something high around your chest for help.",
])
ex('leg-extension', 'Leg Extension', ['Quads'], [
    "Adjust the seat so your knees line up with the machine's pivot point.",
    "The pad rests on your lower shins, just above your ankles.",
    "Hold the handles and keep your hips down on the seat.",
    "Straighten your legs fully and squeeze your quads for a second.",
    "Lower slowly; don't let the weights drop.",
])
ex('hip-adduction', 'Hip Adduction Machine', ['Adductors'], [
    "Set the pads on your inner thighs, just above your knees.",
    "Start from a comfortable stretch; don't force the range.",
    "Squeeze your legs together and pause.",
    "Return slowly without letting the weights touch.",
    "Keep your back against the pad and use a weight you can control.",
])
ex('calf-raise', 'Calf Raise', ['Calves'], [
    "Stand with the balls of your feet on a step or plate so your heels can drop below it.",
    "Keep your knees almost straight and your body upright.",
    "Lower slowly into a deep stretch and pause for a second at the bottom.",
    "Rise as high as you can, pushing through your big toe, and pause at the top.",
    "No bouncing. The stretch and the pauses are what make it work.",
])
ex('seated-calf-raise', 'Seated Calf Raise', ['Calves'], [
    "Sit with the pad resting on your lower thighs, just above the knees.",
    "Balls of your feet on the platform, heels free.",
    "Lower your heels into a deep stretch and pause.",
    "Push up as high as you can and pause at the top.",
    "Keep it slow and controlled; no bouncing.",
])

# ---------------- Back ----------------
ex('pullup', 'Pull-up', ['Back', 'Biceps'], [
    "Grip the bar a little wider than your shoulders, palms facing away.",
    "Start from a full hang, then pull your shoulders down away from your ears before bending your arms.",
    "Drive your elbows down toward your hips and pull your chest toward the bar.",
    "Get your chin over the bar without craning your neck.",
    "Lower all the way to straight arms under control.",
    "Keep your body still. If you need to swing, use a band or the assisted pull-up machine.",
])
ex('assisted-pullup', 'Assisted Pull-up', ['Back', 'Biceps'], [
    "Set the assistance on the machine or loop a band over the bar. More assistance makes it easier.",
    "Grip a little wider than your shoulders and start from straight arms.",
    "Pull your shoulders down first, then drive your elbows toward your hips.",
    "Bring your chin above the bar, then lower slowly to straight arms.",
    "Leave the weight at 0 and write the assistance in your notes, so the app suggests reps rather than weight.",
    "Use less assistance over time until you can do real pull-ups.",
])
ex('lat-pulldown', 'Lat Pulldown', ['Back', 'Biceps'], [
    "Set the thigh pad so your legs are locked in, and grip a little wider than your shoulders.",
    "Sit tall with a slight lean back and your chest up.",
    "Start each rep by pulling your shoulders down, then pull the bar to your upper chest.",
    "Think \"elbows down to your back pockets\" rather than pulling with your hands.",
    "Let the bar rise slowly until your arms are straight and you feel a stretch in your lats.",
    "Don't lean far back or swing; that turns it into a row.",
])
ex('row', 'Barbell Row', ['Back', 'Biceps'], [
    "Hold the bar with hands just outside your knees, then hinge until your torso is at about 45° or lower, knees soft.",
    "Keep your back flat and your core braced.",
    "Pull the bar to your lower ribs or upper stomach, leading with your elbows.",
    "Squeeze your shoulder blades together at the top.",
    "Lower under control to straight arms, letting your shoulder blades stretch forward.",
    "Keep the same torso angle every rep. Standing up more as you tire means the weight is too heavy.",
])
ex('db-row', 'One-arm Dumbbell Row', ['Back', 'Biceps'], [
    "Put one knee and the same-side hand on a bench, back flat.",
    "Hold the dumbbell with your arm straight below your shoulder.",
    "Pull the dumbbell toward your hip, keeping your elbow close to your body.",
    "Squeeze your back at the top without twisting your torso.",
    "Lower to a full stretch at the bottom.",
])
ex('cable-row', 'Seated Cable Row', ['Back', 'Biceps'], [
    "Sit tall with your knees slightly bent and feet on the platform.",
    "Pull the handle to your stomach, keeping your elbows close to your body.",
    "Squeeze your shoulder blades together and pause for a second.",
    "Return slowly until your arms are straight and your shoulder blades stretch forward, without rounding your lower back.",
    "Keep your shoulders down, away from your ears.",
    "Your torso stays still. If you're rocking back and forth, lower the weight.",
])

# ---------------- Chest ----------------
ex('bench', 'Bench Press', ['Chest', 'Shoulders', 'Triceps'], [
    "Lie with your eyes under the bar and your feet flat on the floor.",
    "Grip slightly wider than your shoulders so your forearms are vertical at the bottom.",
    "Pull your shoulder blades back and down, keeping a slight arch in your upper back.",
    "Lower the bar to your lower chest with your elbows about 45–70° from your body.",
    "Touch your chest lightly, without bouncing, and press up and slightly back over your shoulders.",
    "Keep your feet planted and your butt on the bench.",
    "Use safety bars or a spotter when you go heavy.",
])
ex('db-bench', 'Dumbbell Bench Press', ['Chest', 'Shoulders', 'Triceps'], [
    "Sit with the dumbbells on your thighs, then lie back and bring them up over your chest.",
    "Pull your shoulder blades back and down into the bench, feet flat.",
    "Lower the dumbbells beside your chest, elbows about 45° from your body and forearms vertical.",
    "Go down until you feel a good stretch in your chest.",
    "Press up and slightly in until your arms are straight.",
    "To finish, bring the dumbbells to your chest and roll up to sitting with them on your thighs.",
])
ex('incline-db', 'Incline Dumbbell Press', ['Chest', 'Shoulders'], [
    "Set the bench to 30–45°. Lower inclines keep the focus on the chest; higher ones shift it to the shoulders.",
    "Start with the dumbbells over your upper chest, palms forward or slightly turned in.",
    "Keep your shoulder blades pulled back against the bench.",
    "Lower until the dumbbells are beside your upper chest and you feel a stretch, forearms vertical.",
    "Press up and slightly in without clanging the dumbbells together.",
])
ex('machine-chest-press', 'Machine Chest Press', ['Chest', 'Shoulders', 'Triceps'], [
    "Adjust the seat so the handles line up with the middle of your chest.",
    "Sit with your back against the pad and your shoulder blades pulled back.",
    "Press forward until your arms are straight, without lifting your shoulders.",
    "Return slowly until you feel a stretch in your chest.",
    "Keep your wrists straight and your elbows slightly below shoulder height.",
])
ex('chest-fly', 'Chest Fly', ['Chest'], [
    "Lie on a flat bench with dumbbells over your chest, palms facing each other.",
    "Keep a slight bend in your elbows and hold it for the whole rep.",
    "Open your arms wide in an arc until you feel a stretch across your chest.",
    "Bring the dumbbells back together over your chest, as if hugging a tree.",
    "Use a light weight. A deep, controlled stretch matters more than the load.",
], step=1)
ex('pushup', 'Push-up', ['Chest', 'Shoulders', 'Triceps'], [
    "Hands slightly wider than your shoulders, fingers spread.",
    "Keep your body in one straight line from head to heels; squeeze your glutes and brace your core.",
    "Lower until your chest is about a fist's height from the floor, elbows about 45° from your body.",
    "Push the floor away until your arms are straight.",
    "Don't let your hips sag or pike up.",
    "Too hard? Put your hands on a bench or box. The higher your hands, the easier it gets.",
])
ex('dip', 'Dip', ['Chest', 'Triceps'], [
    "Support yourself on straight arms with your shoulders pulled down, away from your ears.",
    "Lean slightly forward for more chest; stay upright for more triceps.",
    "Lower until your upper arms are about parallel to the floor, or as low as your shoulders feel comfortable.",
    "Press back up to straight arms without swinging.",
    "Use the assisted dip machine or a band until you can do clean reps.",
    "If the front of your shoulder hurts, don't go as deep.",
])

# ---------------- Shoulders ----------------
ex('ohp', 'Overhead Press', ['Shoulders', 'Triceps'], [
    "Rest the bar on the front of your shoulders, hands just outside them, forearms vertical.",
    "Stand with feet hip-width; squeeze your glutes and brace so you don't lean back.",
    "Pull your chin back slightly and press the bar straight up past your face.",
    "Once the bar passes your forehead, move your head forward so the bar finishes over the middle of your feet.",
    "Lock your arms out fully at the top.",
    "Keep your wrists stacked over your elbows, not bent back.",
])
ex('db-shoulder-press', 'Dumbbell Shoulder Press', ['Shoulders', 'Triceps'], [
    "Sit on an upright bench, or stand, with the dumbbells at shoulder height.",
    "Palms forward or slightly turned in, forearms vertical.",
    "Brace your core and keep your back against the pad.",
    "Press up until your arms are straight and the dumbbells are over your shoulders.",
    "Lower until the dumbbells are at about chin to shoulder level.",
    "Don't arch your lower back to push more weight.",
])
ex('lateral-raise', 'Lateral Raise', ['Shoulders'], [
    "Stand tall, leaning slightly forward, with a soft bend in your elbows.",
    "Raise the dumbbells out to the sides, leading with your elbows, up to about shoulder height.",
    "Keep your shoulders down. Don't shrug the weight up.",
    "Lower slowly; the way down is half the exercise.",
    "No swinging. Choose a weight you can control, usually lighter than you think.",
], step=1)
ex('rear-delt-fly', 'Rear Delt Fly', ['Shoulders', 'Back'], [
    "Hinge forward with a flat back, or lie chest-down on an incline bench.",
    "Hold light dumbbells below your shoulders with a slight bend in your elbows.",
    "Raise your arms out to the sides, leading with your elbows.",
    "Stop at shoulder height and squeeze the backs of your shoulders.",
    "Keep your neck relaxed and don't shrug.",
    "Lower slowly. Light weight, strict form.",
], step=1)
ex('face-pull', 'Face Pull', ['Shoulders', 'Back'], [
    "Set a rope on a cable at upper-chest to face height.",
    "Grip with your thumbs facing back, step back and stand tall.",
    "Pull the rope toward your forehead, pulling the ends apart.",
    "Finish with your hands beside your ears and elbows high, as if showing off your biceps.",
    "Pause, then return slowly. Keep it light and controlled.",
], step=1)

# ---------------- Arms ----------------
ex('curl', 'Biceps Curl', ['Biceps'], [
    "Stand tall with your elbows by your sides and palms facing forward.",
    "Curl the weight up by bending only at the elbows.",
    "Keep your wrists straight, in line with your forearms.",
    "Squeeze at the top, then lower slowly to straight arms.",
    "No swinging or leaning back. If you need momentum, the weight is too heavy.",
])
ex('hammer-curl', 'Hammer Curl', ['Biceps'], [
    "Hold the dumbbells by your sides with palms facing each other.",
    "Keep your elbows by your sides.",
    "Curl up with your palms still facing in, like holding a hammer.",
    "Squeeze at the top, then lower slowly.",
    "No swinging; keep your shoulders still.",
])
ex('triceps-pushdown', 'Triceps Pushdown', ['Triceps'], [
    "Stand close to the cable, leaning slightly forward, elbows tucked by your sides.",
    "Push the bar or rope down until your arms are straight; spread the rope ends at the bottom.",
    "Squeeze your triceps for a moment at the bottom.",
    "Let it rise slowly until your forearms are about parallel to the floor.",
    "Only your forearms move. Don't let your elbows drift forward.",
])
ex('overhead-triceps-extension', 'Overhead Triceps Extension', ['Triceps'], [
    "Hold one dumbbell overhead with both hands, or use a rope on a cable facing away.",
    "Keep your elbows pointing forward and close to your head.",
    "Lower the weight behind your head until you feel a stretch in your triceps.",
    "Straighten your arms fully at the top.",
    "Only your forearms move. Brace your core so your back doesn't arch.",
])

# ---------------- Core ----------------
ex('plank', 'Plank', ['Core'], [
    "Forearms on the floor, elbows under your shoulders.",
    "Keep your body in one straight line from head to heels.",
    "Squeeze your glutes and pull your ribs toward your hips so your lower back doesn't sag.",
    "Don't pike your hips up, and keep breathing.",
    "Log the seconds you hold as reps and leave the weight at 0.",
], time=True)
ex('side-plank', 'Side Plank', ['Core'], [
    "Lie on your side with your elbow under your shoulder and your legs straight and stacked.",
    "Lift your hips so your body is a straight line from head to feet.",
    "Don't let your hips sag or roll forward.",
    "Too hard? Bend your knees and support yourself on them.",
    "Log the seconds as reps with weight 0, and do both sides.",
], time=True)
ex('dead-bug', 'Dead Bug', ['Core'], [
    "Lie on your back with your arms straight up and your knees bent at 90° over your hips.",
    "Press your lower back gently into the floor and keep it there.",
    "Slowly lower the opposite arm and leg toward the floor.",
    "Go only as low as you can without your back lifting.",
    "Return and switch sides. Breathe out as you reach.",
])
ex('hanging-leg-raise', 'Hanging Leg Raise', ['Core'], [
    "Hang from a bar with straight arms and your shoulders pulled down.",
    "Start from a still position, without swinging.",
    "Raise your legs by curling your pelvis up toward your ribs, not just lifting your legs.",
    "Lower slowly back to the start.",
    "Too hard? Raise bent knees instead of straight legs.",
])
ex('cable-crunch', 'Cable Crunch', ['Core'], [
    "Kneel facing a high cable with a rope, hands beside your head.",
    "Keep your hips still; they don't move up and down.",
    "Crunch down by curling your ribs toward your hips.",
    "Pause and squeeze your abs, then return slowly.",
    "Your arms only hold the rope; your abs do the work.",
])
ex('pallof-press', 'Pallof Press', ['Core'], [
    "Set a cable at chest height and stand side-on to it.",
    "Hold the handle at your chest with both hands, feet shoulder-width.",
    "Press the handle straight out in front of you.",
    "Resist the pull: your body and hands shouldn't turn toward the machine.",
    "Hold for a moment, bring it back, and switch sides after your reps.",
], step=1)
ex('ab-wheel', 'Ab Wheel Rollout', ['Core'], [
    "Kneel with the wheel under your shoulders.",
    "Tuck your pelvis and brace your abs hard.",
    "Roll forward slowly, only as far as you can without your lower back sagging.",
    "Pull back by squeezing your abs, not by bending at the hips.",
    "Start with short rollouts and go further as you get stronger.",
])

# ---------------- checks + output ----------------
ids = [e['id'] for e in EX]
assert len(ids) == len(set(ids)), 'duplicate id'
GROUPS = ['Glutes', 'Quads', 'Hamstrings', 'Calves', 'Adductors', 'Back', 'Chest', 'Shoulders', 'Biceps', 'Triceps', 'Core']
for e in EX:
    assert e['groups'] and all(g in GROUPS for g in e['groups']), e['id']
    assert 4 <= len(e['tips']) <= 8, (e['id'], len(e['tips']))
    assert len(set(e['tips'])) == len(e['tips']), e['id']
    for t in e['tips']:
        assert t.endswith(('.', '?', '"')) or t.endswith('".'), (e['id'], t)

def js_str(s): return json.dumps(s, ensure_ascii=False)
lines = []
lines.append("// Built-in exercise library with form tips.")
lines.append("// Generated from the library source; edit tips in the app or here.")
lines.append("// Each exercise lists its muscle groups, main one first.")
lines.append("// Bump TIPS_VERSION when built-in tips change, so saved libraries pick up the new ones.")
lines.append("const TIPS_VERSION = 3;")
lines.append("// Order of the muscle-group filters in the Exercises tab.")
lines.append("const MUSCLE_GROUPS = " + json.dumps(GROUPS) + ";")
lines.append("const DEFAULT_EXERCISES = [")
for e in EX:
    extra = ''.join(f", {k}: {json.dumps(v)}" for k, v in e.items() if k not in ('id', 'name', 'groups', 'tips'))
    lines.append(f"  {{ id: {js_str(e['id'])}, name: {js_str(e['name'])}, groups: {json.dumps(e['groups'])}{extra}, tips: [")
    for t in e['tips']:
        lines.append(f"    {js_str(t)},")
    lines.append("  ] },")
lines.append("];")
out = '\n'.join(lines) + '\n'
assert 'const MUSCLE_GROUPS = ' + json.dumps(GROUPS) + ';' in out
open(sys.argv[1], 'w').write(out)
print(len(EX), 'exercises,', sum(len(e['tips']) for e in EX), 'tips')
