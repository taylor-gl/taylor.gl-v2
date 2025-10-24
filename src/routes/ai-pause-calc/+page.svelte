<script>
  let values = {
    A: 60,
    B: 40,
    C: 10,
    E: 10,
    F: 5,
    G: 8,
    R: 1000,
    S: 10,
  };

  // Calculated values
  $: D = values.B + values.C;
  $: H = values.A * values.B;
  $: I = (values.E / 100) * values.G * 1000;
  $: J = H + I;
  $: K = values.A * D;
  $: M = (values.F / 100) * values.G * 1000;
  $: N = K + M;
  $: P = N - J;
  $: Q = values.E - values.F;
  $: T = values.R * 100;
  $: U = values.S * Q;
  $: V = T > U;

  function formatNumber(num) {
    return num.toLocaleString();
  }
</script>

<div class="container">
  <h1>AI Pause Decision Calculator</h1>
  <p class="subtitle">
    Evaluate whether pausing AI development is favorable based on your estimates
  </p>

  <div class="fields">
    <div class="field input-field">
      <label>
        <span class="var-name">A</span> current number of deaths per year
      </label>
      <div class="input-group">
        <input type="number" bind:value={values.A} step="1" />
        <span class="unit">million</span>
      </div>
    </div>

    <div class="field input-field">
      <label>
        <span class="var-name">B</span> guess for years until AGI, no pause
      </label>
      <div class="input-group">
        <input type="number" bind:value={values.B} step="1" />
        <span class="unit">years</span>
      </div>
    </div>

    <div class="field input-field">
      <label>
        <span class="var-name">C</span> pause duration, let's say
      </label>
      <div class="input-group">
        <input type="number" bind:value={values.C} step="1" />
        <span class="unit">years</span>
      </div>
    </div>

    <div class="field result-field">
      <div class="result-label">
        <span class="var-name">D</span> years until AGI, given a pause (B + C)
      </div>
      <div class="result-value">{formatNumber(D)} years</div>
    </div>

    <div class="field input-field">
      <label>
        <span class="var-name">E</span> guess for p(doom), given no pause
      </label>
      <div class="input-group">
        <input type="number" bind:value={values.E} step="1" />
        <span class="unit">%</span>
      </div>
    </div>

    <div class="field input-field">
      <label>
        <span class="var-name">F</span> guess p(doom) given a pause
      </label>
      <div class="input-group">
        <input type="number" bind:value={values.F} step="1" />
        <span class="unit">%</span>
      </div>
    </div>

    <div class="field input-field">
      <label>
        <span class="var-name">G</span> current world population, about
      </label>
      <div class="input-group">
        <input type="number" bind:value={values.G} step="1" />
        <span class="unit">billion</span>
      </div>
    </div>

    <div class="field result-field">
      <div class="result-label">
        <span class="var-name">H</span> deaths before AGI, given no pause (A × B)
      </div>
      <div class="result-value">{formatNumber(H)} million</div>
    </div>

    <div class="field result-field">
      <div class="result-label">
        <span class="var-name">I</span> expected deaths from doom, given no pause (E × G)
      </div>
      <div class="result-value">{formatNumber(I)} million</div>
    </div>

    <div class="field result-field">
      <div class="result-label">
        <span class="var-name">J</span> total expected deaths, given no pause (H + I)
      </div>
      <div class="result-value">{formatNumber(J)} million</div>
    </div>

    <div class="field result-field">
      <div class="result-label">
        <span class="var-name">K</span> deaths before AGI, given a pause (A × D)
      </div>
      <div class="result-value">{formatNumber(K)} million</div>
    </div>

    <div class="field result-field">
      <div class="result-label">
        <span class="var-name">M</span> expected deaths from doom, given a pause (F × G)
      </div>
      <div class="result-value">{formatNumber(M)} million</div>
    </div>

    <div class="field result-field">
      <div class="result-label">
        <span class="var-name">N</span> total expected deaths, given a pause (K + M)
      </div>
      <div class="result-value">{formatNumber(N)} million</div>
    </div>

    <div class="field result-field">
      <div class="result-label">
        <span class="var-name">P</span> additional expected deaths from pausing (N - J)
      </div>
      <div class="result-value">{formatNumber(P)} million</div>
    </div>

    <div class="field result-field">
      <div class="result-label">
        <span class="var-name">Q</span> additional chance of humanity ceasing to exist if we don't pause
        (E - F)
      </div>
      <div class="result-value">{formatNumber(Q)} %</div>
    </div>

    <div class="field input-field">
      <label>
        <span class="var-name">R</span> amount of effort I'd spend to reduce chances of P people dying
        by 1%
      </label>
      <div class="input-group">
        <input type="number" bind:value={values.R} step="1" />
        <span class="unit">effort units</span>
      </div>
    </div>

    <div class="field input-field">
      <label>
        <span class="var-name">S</span> amount of effort I'd spend to reduce chances of humanity gracefully
        petering out by 1%
      </label>
      <div class="input-group">
        <input type="number" bind:value={values.S} step="1" />
        <span class="unit">effort units</span>
      </div>
    </div>

    <div class="field result-field">
      <div class="result-label">
        <span class="var-name">T</span> amount of effort I'd spend to avoid the negative outcomes of
        pausing AI (R × 100)
      </div>
      <div class="result-value">{formatNumber(T)} effort units</div>
    </div>

    <div class="field result-field">
      <div class="result-label">
        <span class="var-name">U</span> amount of effort I'd spend to avoid the negative outcomes of
        NOT pausing AI (S × Q)
      </div>
      <div class="result-value">{formatNumber(U)} effort units</div>
    </div>

    <div class="field result-field highlight">
      <div class="result-label">
        <span class="var-name">V</span> is an AI pause favorable? (is U greater than T?)
      </div>
      <div class="result-value">{V ? 'No' : 'Yes'}</div>
    </div>
  </div>

  <div class="info-box">
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
    <div>
      <strong>Interpretation:</strong> If U &gt; T, then an AI pause is favorable. If T &gt; U, then
      continuing AI development (no pause) is favorable. The calculation compares how much effort you'd
      expend to prevent the downsides of each option.
    </div>
  </div>
</div>

<style>
  .container {
    max-width: 48rem;
    margin: 0 auto;
    padding: 1.5rem;
    background: white;
  }

  h1 {
    font-size: 1.875rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    color: #111827;
  }

  .subtitle {
    color: #6b7280;
    margin-bottom: 2rem;
  }

  .fields {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .field {
    margin-bottom: 1rem;
  }

  .input-field label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.25rem;
  }

  .var-name {
    font-family: monospace;
    background-color: #f3f4f6;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    font-weight: 600;
  }

  .input-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  input[type='number'] {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 1rem;
  }

  input[type='number']:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .unit {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .result-field {
    padding: 0.75rem;
    border-radius: 0.5rem;
    background-color: #f9fafb;
  }

  .result-field.highlight {
    background-color: #eff6ff;
    border: 2px solid #93c5fd;
  }

  .result-label {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
  }

  .result-value {
    font-size: 1.25rem;
    font-weight: bold;
    color: #111827;
  }

  .result-field.highlight .result-value {
    color: #1d4ed8;
  }

  .info-box {
    margin-top: 1.5rem;
    padding: 1rem;
    background-color: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 0.5rem;
    display: flex;
    gap: 0.75rem;
    font-size: 0.875rem;
    color: #92400e;
  }

  .info-box svg {
    flex-shrink: 0;
    margin-top: 0.125rem;
    color: #d97706;
  }
</style>
