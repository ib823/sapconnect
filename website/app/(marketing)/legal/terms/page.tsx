// Copyright 2024-2026 SEN Contributors
// SPDX-License-Identifier: Apache-2.0

export const metadata = {
  title: 'Terms of Use',
  description: 'SEN Terms of Use — SAP Enterprise Navigator',
};

export default function TermsPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl px-6 py-16">
      <h1>Terms of Use</h1>
      <p className="text-sm text-muted-foreground">Last updated: February 2026</p>

      <h2>1. Software License</h2>
      <p>
        SEN is open-source software distributed under the Apache License 2.0. Your use of SEN is
        governed by that license. There is no additional EULA, subscription agreement, or
        click-through license.
      </p>

      <h2>2. SAP System Access</h2>
      <p>
        SEN connects to SAP systems on your behalf using credentials you provide. By using SEN to
        access SAP systems, you represent and warrant that:
      </p>
      <ul>
        <li>You hold valid SAP software licenses for all systems accessed</li>
        <li>You hold appropriate SAP Named User licenses for your usage</li>
        <li>Your use of SEN complies with your SAP license agreement</li>
        <li>
          You have authorization from your organization to access the target SAP systems
        </li>
        <li>
          You will use SEN in accordance with your organization&apos;s IT policies and change
          management procedures
        </li>
      </ul>

      <h2>3. No SAP Affiliation</h2>
      <p>
        SEN is an independent open-source project. It is not developed, endorsed, certified, or
        supported by SAP SE unless explicitly stated otherwise. SAP and related marks are trademarks
        of SAP SE, used here under nominative fair use.
      </p>

      <h2>4. Limitation of Liability</h2>
      <p>
        SEN is provided &quot;AS IS&quot; under the Apache License 2.0. To the maximum extent
        permitted by applicable law, the SEN contributors shall not be liable for any damages arising
        from use of this software with SAP or any other enterprise system, including but not limited
        to data loss, system downtime, licensing disputes, or financial losses.
      </p>

      <h2>5. Your Responsibilities</h2>
      <p>You are solely responsible for:</p>
      <ul>
        <li>
          Testing all SEN operations in non-production environments before production use
        </li>
        <li>
          Reviewing and approving all write operations (safety gates exist for this purpose)
        </li>
        <li>Maintaining backups of SAP system data</li>
        <li>Ensuring regulatory compliance (GDPR, SOX, HIPAA, etc.)</li>
        <li>Monitoring SEN&apos;s audit logs</li>
      </ul>

      <h2>6. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless the SEN contributors from any claims, damages, or
        expenses arising from your use of SEN, including any claims related to SAP licensing
        compliance.
      </p>
    </article>
  );
}
