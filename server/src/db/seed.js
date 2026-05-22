import pool from './pool.js';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Modules ──────────────────────────────────────────────
    const modules = [
      { slug: 'road-signs', title: 'Road Signs & Markings', icon: 'SignpostBig', order: 1, free: true, premium: false, mins: 120, xp: 500 },
      { slug: 'highway-code', title: 'Highway Code', icon: 'ShieldCheck', order: 2, free: true, premium: false, mins: 180, xp: 600 },
      { slug: 'defensive-driving', title: 'Defensive Driving', icon: 'Car', order: 3, free: true, premium: false, mins: 150, xp: 550 },
      { slug: 'vehicle-roadworthiness', title: 'Vehicle Roadworthiness', icon: 'Wrench', order: 4, free: false, premium: true, mins: 120, xp: 450 },
      { slug: 'traffic-offences', title: 'Traffic Offences & Penalties', icon: 'AlertTriangle', order: 5, free: false, premium: false, mins: 90, xp: 400 },
      { slug: 'first-aid', title: 'First Aid & Accident Response', icon: 'Heart', order: 6, free: false, premium: true, mins: 120, xp: 500 },
      { slug: 'impaired-driving', title: 'Drunk, Drugged & Distracted Driving', icon: 'Wine', order: 7, free: false, premium: false, mins: 60, xp: 350 },
      { slug: 'mock-test', title: 'Mock Theory Test', icon: 'FileCheck', order: 8, free: false, premium: false, mins: 45, xp: 1000 },
    ];

    for (const m of modules) {
      await client.query(
        `INSERT INTO modules (slug, title_en, icon, sort_order, is_free, is_premium, estimated_minutes, xp_reward)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (slug) DO NOTHING`,
        [m.slug, m.title, m.icon, m.order, m.free, m.premium, m.mins, m.xp]
      );
    }

    // ── Lessons for Module 1 (Road Signs) ────────────────────
    const roadSignsLessons = [
      { slug: 'warning-signs', title: 'Warning Signs', content: 'Warning signs alert drivers to potential hazards ahead. They are typically triangular with a red border and white background. Common warning signs in Nigeria include:\n\n• Curve ahead\n• Intersection ahead\n• Road narrows\n• Speed bump\n• School zone\n• Pedestrian crossing\n\nAlways reduce speed when you see a warning sign and prepare for the indicated hazard.', order: 1, mins: 15, xp: 50 },
      { slug: 'regulatory-signs', title: 'Regulatory Signs', content: 'Regulatory signs tell you what you must or must not do. They enforce traffic laws and are legally binding.\n\n**STOP Sign**\nAn octagonal red sign with white letters. You must come to a complete stop at the marked line, crosswalk, or before entering the intersection. Stop for at least 3 seconds. Look left, then right, then left again before proceeding.\n\n**Speed Limit Signs**\nCircular signs with a red border showing the maximum speed allowed. In Nigeria:\n• Residential areas: 50 km/h\n• Urban roads: 50 km/h\n• Single carriageway: 80 km/h\n• Dual carriageway: 100 km/h\n• Expressway: 120 km/h', order: 2, mins: 15, xp: 50 },
      { slug: 'informational-signs', title: 'Informational Signs', content: 'Informational signs provide drivers with directions, distances, and useful information about services and facilities.\n\n**Types:**\n• Direction signs (green background on expressways, blue in urban areas)\n• Distance markers\n• Service signs (petrol station, hospital, rest area)\n• Tourism signs (brown background)\n\nThese signs are not mandatory to follow but help you navigate efficiently.', order: 3, mins: 10, xp: 40 },
      { slug: 'road-markings', title: 'Road Markings', content: 'Road markings painted on the road surface provide important guidance to drivers.\n\n**White Lines:**\n• Broken white line: you may overtake if safe\n• Solid white line: do not cross or overtake\n• Double white lines: absolute no overtaking zone\n\n**Yellow Lines:**\n• Single yellow: no parking during restricted hours\n• Double yellow: no parking at any time\n\n**Other Markings:**\n• Zebra crossings: black and white stripes — stop for pedestrians\n• Box junctions: yellow cross-hatching — do not enter unless exit is clear', order: 4, mins: 12, xp: 45 },
      { slug: 'traffic-lights', title: 'Traffic Lights & Signals', content: 'Traffic lights control the flow of traffic at intersections.\n\n**Standard Sequence:**\n• Red: STOP — do not proceed\n• Red + Amber: Prepare to go (Nigeria uses this sequence)\n• Green: GO — proceed if the way is clear\n• Amber: STOP if safe to do so\n\n**Special Signals:**\n• Flashing amber: proceed with caution\n• Green arrow: you may proceed in the indicated direction\n• Red X: lane closed — do not use\n\n**When traffic lights are out:** Treat the intersection as an uncontrolled junction. Yield to traffic on your right.', order: 5, mins: 12, xp: 45 },
    ];

    const moduleRes = await client.query(`SELECT id FROM modules WHERE slug = 'road-signs'`);
    const roadSignsId = moduleRes.rows[0]?.id;

    if (roadSignsId) {
      for (const l of roadSignsLessons) {
        await client.query(
          `INSERT INTO lessons (module_id, slug, title_en, content_en, sort_order, estimated_minutes, xp_reward)
           VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (module_id, slug) DO NOTHING`,
          [roadSignsId, l.slug, l.title, l.content, l.order, l.mins, l.xp]
        );
      }
    }

    // ── Lessons for Module 2 (Highway Code) ──────────────────
    const hwRes = await client.query(`SELECT id FROM modules WHERE slug = 'highway-code'`);
    const highwayCodeId = hwRes.rows[0]?.id;

    if (highwayCodeId) {
      const hwLessons = [
        { slug: 'speed-limits', title: 'Speed Limits by Zone', content: 'Nigerian speed limits are set by FRSC and vary by road type:\n\n• Built-up areas: 50 km/h\n• Single carriageway: 80 km/h\n• Dual carriageway: 100 km/h\n• Expressway: 120 km/h\n\nCommercial vehicles have lower limits:\n• Tankers/trailers: 45 km/h (built-up), 60 km/h (highway)\n• Buses: 50 km/h (built-up), 90 km/h (highway)\n\nExceeding the speed limit by more than 30 km/h can result in vehicle impoundment.', order: 1, mins: 12, xp: 50 },
        { slug: 'right-of-way', title: 'Right of Way Rules', content: 'Right of way determines who proceeds first at intersections and junctions.\n\n**General Rules:**\n• At unmarked intersections: yield to vehicles coming from your right\n• At roundabouts: yield to traffic already in the roundabout\n• Emergency vehicles with sirens: always give way\n• Pedestrians at zebra crossings: always stop\n\n**Special situations:**\n• Entering from a minor road to a major road: yield to major road traffic\n• U-turns: yield to all other traffic\n• Merging lanes: the vehicle ahead has priority', order: 2, mins: 15, xp: 50 },
        { slug: 'roundabouts', title: 'Roundabout Procedures', content: 'Roundabouts require specific procedures in Nigeria:\n\n**Approaching:**\n1. Slow down and check for traffic from the right\n2. Yield to traffic already on the roundabout\n3. Signal your intention before entering\n\n**On the roundabout:**\n• Keep to the left unless overtaking\n• Signal left when taking any exit\n• Do not stop on the roundabout\n\n**Multi-lane roundabouts:**\n• Left lane: for turning left or going straight\n• Right lane: for turning right or making a U-turn\n• Signal clearly before changing lanes', order: 3, mins: 12, xp: 45 },
        { slug: 'overtaking', title: 'Overtaking Rules', content: 'Overtaking is one of the most dangerous manoeuvres. Follow these FRSC rules:\n\n**When you CAN overtake:**\n• Road is clear ahead for a safe distance\n• Broken centre line\n• No oncoming traffic\n• Visibility is good\n\n**NEVER overtake when:**\n• On a solid white line\n• Near a hill crest or blind curve\n• Near a junction, bridge or tunnel\n• Another vehicle is already overtaking\n• At or near a pedestrian crossing\n\n**How to overtake safely:**\n1. Check mirrors and blind spot\n2. Signal right\n3. Accelerate and pass quickly\n4. Signal left and return to your lane\n5. Only return when you can see the overtaken vehicle in your mirror', order: 4, mins: 12, xp: 50 },
      ];

      for (const l of hwLessons) {
        await client.query(
          `INSERT INTO lessons (module_id, slug, title_en, content_en, sort_order, estimated_minutes, xp_reward)
           VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (module_id, slug) DO NOTHING`,
          [highwayCodeId, l.slug, l.title, l.content, l.order, l.mins, l.xp]
        );
      }
    }

    // ── Questions (topic-tagged, mock-test eligible) ─────────
    const questions = [
      // Road Signs
      { module: 'road-signs', topic: 'warning_signs', q: 'What shape are warning signs in Nigeria?', opts: ['Circular', 'Triangular', 'Octagonal', 'Rectangular'], correct: 1, explanation: 'Warning signs in Nigeria are triangular with a red border and white background.', difficulty: 1 },
      { module: 'road-signs', topic: 'regulatory_signs', q: 'What shape is a STOP sign in Nigeria?', opts: ['Circle', 'Triangle', 'Octagon (8-sided)', 'Rectangle'], correct: 2, explanation: 'A STOP sign is always octagonal (8-sided) with white text on a red background.', difficulty: 1 },
      { module: 'road-signs', topic: 'regulatory_signs', q: 'How long must you stop at a STOP sign?', opts: ['1 second', '2 seconds', '3 seconds', 'No specific time'], correct: 2, explanation: 'You must stop for at least 3 seconds and look left, right, then left again before proceeding.', difficulty: 1 },
      { module: 'road-signs', topic: 'regulatory_signs', q: 'What color is a regulatory STOP sign?', opts: ['Red with white text', 'Yellow with black text', 'Blue with white text', 'Green with white text'], correct: 0, explanation: 'STOP signs are red with white text worldwide, including Nigeria.', difficulty: 1 },
      { module: 'road-signs', topic: 'road_markings', q: 'What does a broken white centre line mean?', opts: ['No overtaking', 'You may overtake if safe', 'Road closed ahead', 'Speed limit zone'], correct: 1, explanation: 'A broken white centre line means you may overtake if it is safe to do so.', difficulty: 1 },
      { module: 'road-signs', topic: 'road_markings', q: 'What does a double yellow line on the road mean?', opts: ['Overtaking allowed', 'No parking at any time', 'One-way street', 'Speed limit zone'], correct: 1, explanation: 'Double yellow lines mean no parking at any time.', difficulty: 1 },
      { module: 'road-signs', topic: 'traffic_lights', q: 'What does a red traffic light mean?', opts: ['Slow down', 'Stop completely', 'Proceed with caution', 'Yield to traffic'], correct: 1, explanation: 'A red traffic light means you must stop completely and not proceed until it turns green.', difficulty: 1 },
      { module: 'road-signs', topic: 'traffic_lights', q: 'What should you do when traffic lights are out of order?', opts: ['Drive through quickly', 'Treat as uncontrolled junction', 'Always stop and wait', 'Use your horn'], correct: 1, explanation: 'When traffic lights are out, treat the intersection as an uncontrolled junction. Yield to traffic on your right.', difficulty: 2 },
      { module: 'road-signs', topic: 'informational_signs', q: 'What colour background do expressway direction signs use in Nigeria?', opts: ['Blue', 'Green', 'Brown', 'Yellow'], correct: 1, explanation: 'Expressway direction signs use a green background, while urban direction signs use blue.', difficulty: 2 },
      { module: 'road-signs', topic: 'warning_signs', q: 'A triangular sign with a red border showing children means:', opts: ['Playground ahead', 'School zone — slow down', 'Children not allowed', 'Hospital nearby'], correct: 1, explanation: 'This warning sign indicates a school zone. You must reduce speed and watch for children.', difficulty: 1 },

      // Highway Code
      { module: 'highway-code', topic: 'speed_limits', q: 'What is the maximum speed limit in built-up areas in Nigeria?', opts: ['30 km/h', '50 km/h', '70 km/h', '90 km/h'], correct: 1, explanation: 'The maximum speed limit in built-up/residential areas in Nigeria is 50 km/h.', difficulty: 1 },
      { module: 'highway-code', topic: 'speed_limits', q: 'What is the speed limit for tankers in built-up areas?', opts: ['30 km/h', '45 km/h', '50 km/h', '60 km/h'], correct: 1, explanation: 'Tankers and trailers have a maximum speed of 45 km/h in built-up areas.', difficulty: 2 },
      { module: 'highway-code', topic: 'speed_limits', q: 'What is the expressway speed limit for private cars?', opts: ['100 km/h', '110 km/h', '120 km/h', '140 km/h'], correct: 2, explanation: 'The expressway speed limit for private vehicles in Nigeria is 120 km/h.', difficulty: 1 },
      { module: 'highway-code', topic: 'right_of_way', q: 'At an unmarked intersection, you must yield to:', opts: ['Vehicles from your left', 'Vehicles from your right', 'The larger vehicle', 'Whoever arrives first'], correct: 1, explanation: 'At unmarked intersections in Nigeria, you yield to vehicles approaching from your right.', difficulty: 1 },
      { module: 'highway-code', topic: 'right_of_way', q: 'When approaching a zebra crossing with pedestrians, you must:', opts: ['Honk to warn them', 'Speed up to pass quickly', 'Stop and give way', 'Slow down but continue'], correct: 2, explanation: 'You must always stop and give way to pedestrians at a zebra crossing.', difficulty: 1 },
      { module: 'highway-code', topic: 'roundabouts', q: 'When entering a roundabout, you must yield to:', opts: ['Traffic from the left', 'Traffic already on the roundabout', 'Nobody — first come first served', 'Larger vehicles only'], correct: 1, explanation: 'You must always yield to traffic already circulating on the roundabout.', difficulty: 1 },
      { module: 'highway-code', topic: 'roundabouts', q: 'On a multi-lane roundabout, which lane should you use to turn right?', opts: ['Left lane', 'Right lane', 'Either lane', 'Middle lane'], correct: 1, explanation: 'Use the right lane for turning right or making a U-turn on a multi-lane roundabout.', difficulty: 2 },
      { module: 'highway-code', topic: 'overtaking', q: 'You should NEVER overtake near:', opts: ['A traffic light', 'A petrol station', 'A hill crest or blind curve', 'A parked car'], correct: 2, explanation: 'Never overtake near a hill crest or blind curve because you cannot see oncoming traffic.', difficulty: 1 },
      { module: 'highway-code', topic: 'overtaking', q: 'What is the correct overtaking sequence?', opts: ['Signal, mirror, overtake', 'Mirror, signal, overtake', 'Overtake, then signal', 'Horn, then overtake'], correct: 1, explanation: 'The correct sequence is: check mirrors, signal right, accelerate and pass, signal left, return to lane.', difficulty: 2 },
      { module: 'highway-code', topic: 'right_of_way', q: 'Emergency vehicles with active sirens:', opts: ['Have no special rights', 'Should be overtaken quickly', 'Must always be given right of way', 'Only have priority on highways'], correct: 2, explanation: 'You must always give way to emergency vehicles with active sirens and lights.', difficulty: 1 },

      // Defensive Driving
      { module: 'defensive-driving', topic: 'following_distance', q: 'The minimum safe following distance in good weather is:', opts: ['1 second', '2 seconds', '3 seconds', '5 seconds'], correct: 1, explanation: 'The minimum safe following distance in good conditions is 2 seconds. In rain or poor visibility, increase to 4 seconds.', difficulty: 1 },
      { module: 'defensive-driving', topic: 'following_distance', q: 'In heavy rain, your following distance should be:', opts: ['Same as normal', 'Double the normal distance', 'Half the normal distance', 'No specific rule'], correct: 1, explanation: 'In rain or poor conditions, double your following distance to at least 4 seconds.', difficulty: 1 },
      { module: 'defensive-driving', topic: 'night_driving', q: 'When driving at night without street lights, you should:', opts: ['Drive at normal speed', 'Use high beams at all times', 'Reduce speed and use headlights', 'Follow the car ahead closely'], correct: 2, explanation: 'At night, reduce speed so you can stop within the distance illuminated by your headlights.', difficulty: 1 },
      { module: 'defensive-driving', topic: 'hazard_awareness', q: 'When approaching a pothole on a Nigerian road, the safest action is:', opts: ['Swerve sharply', 'Brake hard over it', 'Slow down and straddle or avoid it', 'Speed up to jump over it'], correct: 2, explanation: 'Slow down well before the pothole and carefully straddle or drive around it without sudden swerving.', difficulty: 2 },
      { module: 'defensive-driving', topic: 'hazard_awareness', q: 'Aquaplaning (hydroplaning) occurs when:', opts: ['You drive too slowly', 'Your tyres lose contact with the road due to water', 'You brake too gently', 'You use cruise control'], correct: 1, explanation: 'Aquaplaning happens when a layer of water builds between your tyres and the road. Reduce speed in wet conditions.', difficulty: 2 },

      // Vehicle Roadworthiness
      { module: 'vehicle-roadworthiness', topic: 'tyres', q: 'The minimum legal tyre tread depth in Nigeria is:', opts: ['0.5mm', '1mm', '1.6mm', '3mm'], correct: 2, explanation: 'The minimum legal tread depth is 1.6mm. Below this, your tyres are unsafe and you can be fined.', difficulty: 2 },
      { module: 'vehicle-roadworthiness', topic: 'lights', q: 'Which lights must be checked before driving?', opts: ['Headlights only', 'Headlights and tail lights', 'All lights including indicators and brake lights', 'Only lights used at night'], correct: 2, explanation: 'Check all lights before every journey: headlights, tail lights, brake lights, indicators and hazard lights.', difficulty: 1 },
      { module: 'vehicle-roadworthiness', topic: 'brakes', q: 'A spongy brake pedal usually indicates:', opts: ['Normal operation', 'Air in the brake lines', 'New brake pads', 'Cold weather effect'], correct: 1, explanation: 'A spongy brake pedal usually means air has entered the brake fluid system. Have it inspected immediately.', difficulty: 2 },

      // Traffic Offences
      { module: 'traffic-offences', topic: 'penalties', q: 'Using a mobile phone while driving is:', opts: ['Allowed if hands-free', 'Only illegal on highways', 'Completely illegal while driving', 'Allowed in traffic jams'], correct: 2, explanation: 'Using a mobile phone while driving is completely illegal in Nigeria. Pull over safely first.', difficulty: 1 },
      { module: 'traffic-offences', topic: 'penalties', q: 'What is the FRSC emergency number?', opts: ['112', '122', '199', '911'], correct: 1, explanation: 'The FRSC emergency toll-free number is 122. This is the number to call for road emergencies.', difficulty: 1 },
      { module: 'traffic-offences', topic: 'checkpoints', q: 'At an FRSC checkpoint, you are required to:', opts: ['Speed through if the road is clear', 'Stop only if flagged down', 'Slow down and be prepared to stop', 'Ignore if not a police checkpoint'], correct: 2, explanation: 'You must slow down at any checkpoint and be prepared to stop if signalled.', difficulty: 1 },

      // First Aid
      { module: 'first-aid', topic: 'crash_response', q: 'The first thing to do at a crash scene is:', opts: ['Move the injured', 'Call 122', 'Ensure the scene is safe', 'Direct traffic'], correct: 2, explanation: 'Always ensure the scene is safe for you and others first (DRABC: Danger, Response, Airway, Breathing, Circulation).', difficulty: 1 },
      { module: 'first-aid', topic: 'crash_response', q: 'The FRSC "Golden Hour" refers to:', opts: ['Peak traffic time', 'The first hour after an accident when medical care is most critical', 'One hour before sunset', 'Vehicle inspection time'], correct: 1, explanation: 'The Golden Hour is the critical first 60 minutes after an accident. Getting medical help quickly saves lives.', difficulty: 1 },
      { module: 'first-aid', topic: 'first_aid_basics', q: 'When should you move an injured person from a vehicle?', opts: ['Always immediately', 'Only if there is immediate danger (fire, explosion)', 'Never — wait for professionals', 'If they ask you to'], correct: 1, explanation: 'Only move an injured person if they face immediate danger like fire. Otherwise, wait for trained responders.', difficulty: 2 },

      // Impaired Driving
      { module: 'impaired-driving', topic: 'alcohol', q: 'The legal blood alcohol limit for drivers in Nigeria is:', opts: ['0.0 g/dl', '0.05 g/dl', '0.08 g/dl', '0.10 g/dl'], correct: 1, explanation: 'Nigeria has a 0.05 g/dl blood alcohol limit, but impairment can occur at any level. The safest choice is zero alcohol.', difficulty: 2 },
      { module: 'impaired-driving', topic: 'distraction', q: 'The most dangerous distraction while driving is:', opts: ['Changing radio stations', 'Texting on a mobile phone', 'Talking to passengers', 'Eating food'], correct: 1, explanation: 'Texting takes your eyes, hands and mind off driving — making it the most dangerous distraction.', difficulty: 1 },
      { module: 'impaired-driving', topic: 'fatigue', q: 'The recommended maximum continuous driving time is:', opts: ['2 hours', '4 hours', '6 hours', '8 hours'], correct: 1, explanation: 'Take a break every 2 hours or 200km. Fatigue-related crashes are common on long Nigerian highway journeys.', difficulty: 2 },
    ];

    for (const q of questions) {
      const modRes = await client.query(`SELECT id FROM modules WHERE slug = $1`, [q.module]);
      const modId = modRes.rows[0]?.id;
      if (modId) {
        await client.query(
          `INSERT INTO questions (module_id, topic_tag, question_en, options_en, correct_answer, explanation_en, difficulty)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [modId, q.topic, q.q, JSON.stringify(q.opts), q.correct, q.explanation, q.difficulty]
        );
      }
    }

    // ── Badges ───────────────────────────────────────────────
    const badges = [
      { slug: 'road_ready', title: 'Road Ready', desc: 'Complete all 8 modules', icon: 'Award', xp: 500 },
      { slug: 'roundabout_master', title: 'Roundabout Master', desc: 'Score 100% on Highway Code module', icon: 'Trophy', xp: 200 },
      { slug: 'night_owl', title: 'Night Owl', desc: 'Complete the night driving lesson', icon: 'Moon', xp: 100 },
      { slug: 'frsc_ready', title: 'FRSC Ready', desc: 'Pass all mock tests at 80%+', icon: 'Shield', xp: 500 },
      { slug: 'streak_7', title: 'Week Warrior', desc: '7-day learning streak', icon: 'Flame', xp: 100 },
      { slug: 'streak_30', title: 'Monthly Champion', desc: '30-day learning streak', icon: 'Flame', xp: 300 },
      { slug: 'streak_90', title: 'Unstoppable', desc: '90-day learning streak', icon: 'Flame', xp: 500 },
      { slug: 'first_quiz', title: 'First Steps', desc: 'Complete your first quiz', icon: 'Zap', xp: 50 },
      { slug: 'first_mock', title: 'Test Taker', desc: 'Complete your first mock test', icon: 'FileCheck', xp: 100 },
      { slug: 'perfect_score', title: 'Perfectionist', desc: 'Score 100% on any quiz', icon: 'Star', xp: 200 },
      { slug: 'speed_demon', title: 'Speed Demon', desc: 'Complete a mock test in under 15 minutes', icon: 'Zap', xp: 150 },
    ];

    for (const b of badges) {
      await client.query(
        `INSERT INTO badges (slug, title_en, description_en, icon, xp_reward)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT (slug) DO NOTHING`,
        [b.slug, b.title, b.desc, b.icon, b.xp]
      );
    }

    await client.query('COMMIT');
    console.log('Seed completed: 8 modules, lessons, 38 questions, 11 badges');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
