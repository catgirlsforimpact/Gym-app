// Motivational phrases. Edit freely — add, remove or rewrite any line.
// {exercise} is replaced with the exercise name where it appears.
// Tone: during the workout, tough love. After the workout, softer and encouraging.
// The "...Legs" pools are for lower-body growth. They are used (about half the time)
// for Legs and Glutes exercises, and after workouts that included them.
const PHRASES = {
  // When only one set is left on an exercise
  oneSetLeft: [
    'Last set. Leave nothing in the tank.',
    'Final set of {exercise}. You were built for this.',
    'One left. Strong girls finish what they start.',
    'Breathe, brace, and own this last set.',
    'Last set. This is the one that actually counts.',
    'One more. Your only competition is who you were yesterday.',
    'You didn\'t come this far to only come this far. One more.',
    'This is the set that changes you. Go get it.',
    'You\'re tired. Do it anyway.',
    'No negotiating. One more set.',
    'Nobody is lifting this for you, girl. Last set.',
    'Claws out. One set left.',
    'A cat never quits halfway through the pounce. Last set.',
  ],

  // When every set of an exercise is done
  exerciseDone: [
    '{exercise} done. That\'s how it\'s done, girl.',
    'Another one down. Don\'t get comfortable.',
    'Ticked off. Nothing can stop you today.',
    'Finished {exercise}. Stronger than yesterday.',
    'Good, girl. One step closer. Keep moving.',
    'You showed up and showed out. Next.',
    'Nailed it. Confidence is built one rep at a time.',
    'Strong, focused, unstoppable. Keep going.',
    '{exercise} done. Rest, then get back to work.',
    'Done. Don\'t celebrate yet, there\'s more.',
    'That\'s one. The workout isn\'t over until you say so.',
    'Clean kill. On to the next one.',
    '{exercise} done. Land on your feet and keep moving.',
    'One down. A lioness doesn\'t stop at one.',
  ],

  // When the whole workout is finished
  workoutDone: [
    'Strong body, strong mind. Today you fed both.',
    'Look at you being that girl. See you next session.',
    'Sweat today, glow tomorrow.',
    'She believed she could, so she did. Great work today.',
    'Hard work looks good on you. Workout complete.',
    'You kept a promise to yourself today. That matters.',
    'Every session counts, and this one is in the books. Be proud, girl.',
    'Done. Go easy on yourself now. Recovery is part of the work.',
    'You showed up, and that\'s the hardest part. Well done.',
    'Small steps, every week. You\'re getting there, girl.',
    'Stretch, eat well, curl up somewhere warm. Great session.',
    'Nine lives, one goal, and you showed up for it today.',
    'Soft paws, strong legs. Good work today.',
  ],

  // Lower body: when only one set is left on a leg or glute exercise
  oneSetLeftLegs: [
    'Last set. Glutes don\'t grow in the comfort zone.',
    'One more set. Those legs won\'t build themselves, girl.',
    'Final set of {exercise}. Drive through your heels and finish it.',
    'Last set. Every rep is building the lower body you want.',
    'One set left. Growth starts where it gets uncomfortable.',
    'One set left. Strong cat legs are earned, not given.',
    'Sink low like a cat about to pounce. Last set.',
  ],

  // Lower body: when a leg or glute exercise is done
  exerciseDoneLegs: [
    '{exercise} done. Your glutes felt that. Next.',
    'Legs shaking? Good. That\'s what growth feels like. Keep moving.',
    '{exercise} done. Stronger hips, stronger legs. Next one.',
    'Another brick in the lower body you\'re building. Keep going.',
    '{exercise} done. Don\'t go easy on the next one.',
    'Panther legs are built on days like this. Next.',
  ],

  // Lower body: after a workout that included leg or glute exercises
  workoutDoneLegs: [
    'Your lower body is growing, one session at a time. Great work today.',
    'Eat well and sleep well tonight. That\'s when your legs and glutes grow.',
    'Every squat and every hip thrust adds up. Be proud of today, girl.',
    'Strong legs carry you everywhere. Good work building them today.',
    'If you walk a little funny tomorrow, wear it proudly. Great leg day.',
    'Strong haunches, soft heart. Great work today, girl.',
  ],
};
