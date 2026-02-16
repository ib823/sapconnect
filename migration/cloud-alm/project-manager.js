/**
 * Copyright 2024-2026 SEN Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Multi-Project Manager
 *
 * Manages multiple S/4HANA migration projects simultaneously.
 * Each project has its own:
 * - Configuration (source system, target release, modules in scope)
 * - Migration object registry (subset of objects)
 * - Progress tracking
 * - Cloud ALM sync
 *
 * Supports project templates for rapid project setup.
 */

const Logger = require('../../lib/logger');
const MigrationObjectRegistry = require('../objects/registry');
const ProgressTracker = require('../dashboard/progress-tracker');

class ProjectManager {
  constructor(options = {}) {
    this.logger = new Logger('project-mgr', { level: options.verbose ? 'debug' : 'info' });
    this.connector = options.connector || null;
    this._projects = new Map();
  }

  /**
   * Create a new migration project
   */
  createProject(config) {
    const { projectId, name, sourceSystem, targetRelease, modules, template } = config;

    if (this._projects.has(projectId)) {
      throw new Error(`Project ${projectId} already exists`);
    }

    // Apply template if specified
    const templateConfig = template ? this._getTemplate(template) : {};

    const project = {
      projectId,
      name: name || `Migration Project ${projectId}`,
      sourceSystem: sourceSystem || templateConfig.sourceSystem || 'ECC',
      targetRelease: targetRelease || templateConfig.targetRelease || 'S4HANA_2023',
      modules: modules || templateConfig.modules || ['FI', 'CO', 'MM', 'SD'],
      status: 'created',
      createdAt: new Date().toISOString(),
      registry: new MigrationObjectRegistry(),
      tracker: new ProgressTracker(),
      runs: [],
      config: { ...templateConfig, ...config },
    };

    this._projects.set(projectId, project);
    this.logger.info(`Created project ${projectId}: ${project.name}`);

    return {
      projectId: project.projectId,
      name: project.name,
      sourceSystem: project.sourceSystem,
      targetRelease: project.targetRelease,
      modules: project.modules,
      status: project.status,
      objectCount: project.registry.listObjectIds().length,
    };
  }

  /**
   * Get project by ID
   */
  getProject(projectId) {
    const project = this._projects.get(projectId);
    if (!project) return null;

    return {
      projectId: project.projectId,
      name: project.name,
      sourceSystem: project.sourceSystem,
      targetRelease: project.targetRelease,
      modules: project.modules,
      status: project.status,
      createdAt: project.createdAt,
      objectCount: project.registry.listObjectIds().length,
      progress: project.tracker.getProgress(),
      runCount: project.runs.length,
    };
  }

  /**
   * List all projects
   */
  listProjects() {
    return Array.from(this._projects.values()).map(p => ({
      projectId: p.projectId,
      name: p.name,
      sourceSystem: p.sourceSystem,
      targetRelease: p.targetRelease,
      status: p.status,
      modules: p.modules,
    }));
  }

  /**
   * Run migration for a project
   */
  async runProject(projectId, gateway) {
    const project = this._projects.get(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    this.logger.info(`Running migration for project ${projectId}...`);
    project.status = 'running';
    project.tracker.setPhase('migrate');

    const result = await project.registry.runAll(gateway);
    result.timestamp = new Date().toISOString();
    result.projectId = projectId;

    project.runs.push(result);
    project.tracker.recordBatchRun(result);
    project.status = result.stats.failed > 0 ? 'completed_with_errors' : 'completed';

    // Sync to Cloud ALM if connector available
    if (this.connector) {
      await this.connector.pushStatus({
        projectId,
        status: project.status,
        objectsRun: result.stats.total,
        objectsCompleted: result.stats.completed,
        objectsFailed: result.stats.failed,
      });
    }

    this.logger.info(`Project ${projectId} run complete: ${result.stats.completed}/${result.stats.total}`);

    return {
      projectId,
      status: project.status,
      stats: result.stats,
      timestamp: result.timestamp,
    };
  }

  /**
   * Update project status
   */
  updateProject(projectId, updates) {
    const project = this._projects.get(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    if (updates.status) project.status = updates.status;
    if (updates.name) project.name = updates.name;
    if (updates.modules) project.modules = updates.modules;

    return this.getProject(projectId);
  }

  /**
   * Delete a project
   */
  deleteProject(projectId) {
    if (!this._projects.has(projectId)) return false;
    this._projects.delete(projectId);
    this.logger.info(`Deleted project ${projectId}`);
    return true;
  }

  /**
   * Get all available project templates
   */
  getTemplates() {
    return [
      {
        id: 'greenfield_full',
        name: 'Greenfield Full Scope',
        description: 'New S/4HANA implementation — all modules',
        sourceSystem: 'NONE',
        targetRelease: 'S4HANA_2023',
        modules: ['FI', 'CO', 'MM', 'SD', 'PP', 'QM', 'PM', 'PS', 'HR'],
      },
      {
        id: 'brownfield_core',
        name: 'Brownfield Core Finance',
        description: 'System conversion focused on core FI/CO',
        sourceSystem: 'ECC',
        targetRelease: 'S4HANA_2023',
        modules: ['FI', 'CO'],
      },
      {
        id: 'brownfield_full',
        name: 'Brownfield Full Scope',
        description: 'System conversion — all logistics + finance modules',
        sourceSystem: 'ECC',
        targetRelease: 'S4HANA_2023',
        modules: ['FI', 'CO', 'MM', 'SD', 'PP', 'QM', 'PM', 'PS'],
      },
      {
        id: 'selective_data',
        name: 'Selective Data Migration',
        description: 'Shell conversion with selective data migration',
        sourceSystem: 'ECC',
        targetRelease: 'S4HANA_2023',
        modules: ['FI', 'CO', 'MM', 'SD'],
      },
      {
        id: 'landscape_consolidation',
        name: 'Landscape Consolidation',
        description: 'Merge multiple ECC systems into one S/4HANA',
        sourceSystem: 'MULTI_ECC',
        targetRelease: 'S4HANA_2023',
        modules: ['FI', 'CO', 'MM', 'SD', 'PP', 'HR'],
      },
    ];
  }

  _getTemplate(templateId) {
    const templates = this.getTemplates();
    return templates.find(t => t.id === templateId) || {};
  }
}

module.exports = ProjectManager;
