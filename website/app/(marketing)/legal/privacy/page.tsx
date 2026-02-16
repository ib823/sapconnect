// Copyright 2024-2026 SEN Contributors
// SPDX-License-Identifier: Apache-2.0

export const metadata = {
  title: 'Privacy Policy | SEN',
  description: 'SEN Privacy Policy — SAP Enterprise Navigator',
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl px-6 py-16">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: February 2026</p>

      <h2>Data SEN Collects</h2>
      <p>SEN is a self-hosted, open-source tool. When you run SEN:</p>
      <ul>
        <li>
          <strong>No data is sent to SEN contributors or any third party.</strong> All operations run
          locally or within your infrastructure.
        </li>
        <li>SEN does not include telemetry, analytics, or usage tracking.</li>
        <li>
          SEN does not phone home, check for updates automatically, or transmit any data externally.
        </li>
      </ul>

      <h2>Data SEN Processes</h2>
      <p>During operation, SEN processes:</p>
      <ul>
        <li>
          SAP system credentials (provided by you, held in memory only, never persisted to disk by
          SEN)
        </li>
        <li>
          SAP system data accessed via APIs (processed in memory, stored locally per your
          configuration)
        </li>
        <li>Audit logs of operations performed (stored locally per your configuration)</li>
      </ul>

      <h2>Third-Party Services</h2>
      <p>
        SEN&apos;s AI agent features can optionally connect to LLM providers (OpenAI, Anthropic,
        Azure OpenAI). If you configure these integrations, your prompts and SAP data context may be
        sent to those providers subject to their privacy policies. This is optional and disabled by
        default.
      </p>

      <h2>Your Obligations</h2>
      <p>
        If you use SEN to process personal data from SAP systems (employee data from SuccessFactors,
        customer data from S/4HANA, etc.), you are responsible for GDPR/privacy compliance as the
        data controller.
      </p>

      <h2>Contact</h2>
      <p>
        For privacy inquiries, please open an issue on the{' '}
        <a href="https://github.com/ib823/sapconnect">SEN GitHub repository</a>.
      </p>
    </article>
  );
}
