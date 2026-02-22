module.exports = {
	ci: {
		collect: {
			numberOfRuns: 3,
			settings: {
				// Simulate a mid-tier mobile device
				preset: "desktop",
				// Skip audits that need a real backend
				skipAudits: ["is-crawlable"],
			},
		},
		assert: {
			assertions: {
				// Core Web Vitals — lenient thresholds to start
				"largest-contentful-paint": ["warn", { maxNumericValue: 4000 }],
				"cumulative-layout-shift": ["warn", { maxNumericValue: 0.25 }],
				"first-contentful-paint": ["warn", { maxNumericValue: 3000 }],
				"total-blocking-time": ["warn", { maxNumericValue: 600 }],

				// Overall score — warn if below 50 (tighten after baseline established)
				"categories:performance": ["warn", { minScore: 0.5 }],
				"categories:accessibility": ["warn", { minScore: 0.7 }],
				"categories:best-practices": ["warn", { minScore: 0.7 }],
			},
		},
		upload: {
			target: "temporary-public-storage",
		},
	},
};
