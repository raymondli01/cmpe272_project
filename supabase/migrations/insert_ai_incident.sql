INSERT INTO events (
  kind, severity, state, title, description,
  detected_by, confidence, priority, metadata,
  asset_ref, asset_type
) VALUES (
  'leak',
  'critical',
  'open',
  'AI Detected: Major leak at Pipe P-5',
  'Confidence: 92%

Multiple correlated sensor anomalies indicate major pipe rupture requiring immediate action.',
  'Leak Preemption Agent',
  0.92,
  96,
  '{
    "sensor_indicators": {
      "acoustic": "high - 8.2 dB spike detected at sensor S-P5-AC01, indicating turbulent flow from crack or rupture",
      "pressure": "low - dropped from 65 psi to 48 psi in 30 seconds, consistent with major water loss",
      "flow": "high - unexpected 15% flow increase (from 85 L/s to 98 L/s), water escaping system"
    },
    "reasoning": "AI detected three simultaneous anomalies: Pressure dropped 17 psi while acoustic sensors detected an 8.2 dB spike and flow increased 15%. This pattern is highly consistent with a pipe rupture or major crack. The rapid pressure loss combined with increased acoustic activity suggests water is actively escaping the system. Based on historical data, this combination has 92% correlation with confirmed pipe failures.",
    "recommendation": {
      "action": "isolate",
      "valves_to_close": ["V-12", "V-45", "V-67"],
      "dispatch_crew": true,
      "estimated_location": "Between junctions J-45 and J-46, approximately 150m from J-45",
      "estimated_water_loss": "~450 gallons/minute",
      "customers_affected": 45
    },
    "urgency": "immediate",
    "detection_timestamp": "2025-11-13T22:30:00.000Z"
  }'::jsonb,
  'e007eecf-0130-4b28-8d25-9286f7355c96',
  'edge'
);

INSERT INTO events (
  kind, severity, state, title, description,
  detected_by, confidence, priority, metadata,
  asset_ref, asset_type
) VALUES (
  'leak',
  'high',
  'open',
  'AI Detected: Moderate leak at Pipe P-12',
  'Confidence: 78%

Sensor fusion analysis indicates developing leak with moderate urgency.',
  'Leak Preemption Agent',
  0.78,
  73,
  '{
    "sensor_indicators": {
      "acoustic": "medium - gradual increase to 5.8 dB over 2 hours",
      "pressure": "low - steady decline from 68 psi to 59 psi",
      "flow": "normal - within acceptable range but trending upward"
    },
    "reasoning": "AI detected a developing leak pattern: pressure has been gradually declining over 2 hours while acoustic readings show increasing activity. While not as severe as a rupture, this pattern suggests a growing crack that will worsen without intervention. The slower onset indicates time for planned response rather than emergency isolation.",
    "recommendation": {
      "action": "monitor",
      "valves_to_close": ["V-88", "V-92"],
      "dispatch_crew": true,
      "estimated_location": "Pipe P-12 section near valve V-88",
      "suggested_action_time": "within 4 hours"
    },
    "urgency": "soon",
    "detection_timestamp": "2025-11-13T22:25:00.000Z"
  }'::jsonb,
  'bd96ef6b-a2c1-4fb4-863a-068f867f8f44',
  'edge'
);

INSERT INTO events (
  kind, severity, state, title, description,
  detected_by, confidence, priority, metadata,
  asset_ref, asset_type
) VALUES (
  'leak',
  'medium',
  'open',
  'AI Detected: Minor anomaly at Pipe P-18',
  'Confidence: 71%

Sensors showing borderline anomalies that warrant monitoring.',
  'Leak Preemption Agent',
  0.71,
  45,
  '{
    "sensor_indicators": {
      "acoustic": "normal - slight variation within normal range",
      "pressure": "low - 3 psi below normal baseline",
      "flow": "normal - consistent with demand patterns"
    },
    "reasoning": "AI detected a slight pressure deviation that could indicate a very small leak or sensor drift. While confidence is above threshold (71%), the magnitude of anomalies is small. Recommend continued monitoring with additional sensor verification before committing resources to field investigation.",
    "recommendation": {
      "action": "monitor",
      "dispatch_crew": false,
      "estimated_location": "Pipe P-18 full length",
      "suggested_action": "Monitor for 24 hours, escalate if pressure drops further"
    },
    "urgency": "monitor",
    "detection_timestamp": "2025-11-13T22:20:00.000Z"
  }'::jsonb,
  'fd9b78f5-f8af-47c3-8344-154b147b922a',
  'edge'
);
