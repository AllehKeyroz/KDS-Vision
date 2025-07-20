import { Project, ProjectSection, Task } from './types';
import { Timestamp } from 'firebase/firestore';

const UNIFIED_CSV_HEADERS = [
  'project_id', 'project_clientId', 'project_name', 'project_scope', 'project_value', 'project_cost', 'project_status', 'project_deadline', 'project_createdAt',
  'section_id', 'section_title',
  'task_id', 'task_text', 'task_parentId', 'task_description', 'task_responsibleIds', 'task_completed', 'task_priority', 'task_deadline'
];

function escapeCsvValue(value: any): string {
  if (value === undefined || value === null) {
    return '';
  }
  let stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function unescapeCsvValue(value: string): string {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.substring(1, value.length - 1).replace(/""/g, '"');
  }
  return value;
}

export function projectsToCsv(projects: Project[]): string {
  const rows: string[] = [];
  rows.push(UNIFIED_CSV_HEADERS.join(',')); // Add header row

  projects.forEach(project => {
    if (!project.sections || project.sections.length === 0) {
      // If a project has no sections/tasks, we still want to export it
      const rowData: Record<string, any> = {};
      UNIFIED_CSV_HEADERS.forEach(header => {
        if (header.startsWith('project_')) {
          const projectHeader = header.replace('project_', '');
          if (projectHeader === 'deadline' || projectHeader === 'createdAt') {
            const value = project[projectHeader as keyof Project];
            rowData[header] = value instanceof Timestamp ? value.toDate().toISOString() : '';
          } else {
            rowData[header] = escapeCsvValue(project[projectHeader as keyof Project]);
          }
        } else {
          rowData[header] = ''; // Empty for section/task fields
        }
      });
      rows.push(UNIFIED_CSV_HEADERS.map(h => rowData[h]).join(','));
      return;
    }

    project.sections.forEach(section => {
      if (!section.tasks || section.tasks.length === 0) {
        // If a section has no tasks, but the project has sections, export the section row
        const rowData: Record<string, any> = {};
        UNIFIED_CSV_HEADERS.forEach(header => {
          if (header.startsWith('project_')) {
            const projectHeader = header.replace('project_', '');
            if (projectHeader === 'deadline' || projectHeader === 'createdAt') {
              const value = project[projectHeader as keyof Project];
              rowData[header] = value instanceof Timestamp ? value.toDate().toISOString() : '';
            } else {
              rowData[header] = escapeCsvValue(project[projectHeader as keyof Project]);
            }
          } else if (header.startsWith('section_')) {
            const sectionHeader = header.replace('section_', '');
            rowData[header] = escapeCsvValue(section[sectionHeader as keyof ProjectSection]);
          } else {
            rowData[header] = ''; // Empty for task fields
          }
        });
        rows.push(UNIFIED_CSV_HEADERS.map(h => rowData[h]).join(','));
        return;
      }

      section.tasks.forEach(task => {
        const rowData: Record<string, any> = {};

        // Project fields
        UNIFIED_CSV_HEADERS.filter(h => h.startsWith('project_')).forEach(header => {
          const projectHeader = header.replace('project_', '');
          if (projectHeader === 'deadline' || projectHeader === 'createdAt') {
            const value = project[projectHeader as keyof Project];
            rowData[header] = value instanceof Timestamp ? value.toDate().toISOString() : '';
          } else {
            rowData[header] = escapeCsvValue(project[projectHeader as keyof Project]);
          }
        });

        // Section fields
        UNIFIED_CSV_HEADERS.filter(h => h.startsWith('section_')).forEach(header => {
          const sectionHeader = header.replace('section_', '');
          rowData[header] = escapeCsvValue(section[sectionHeader as keyof ProjectSection]);
        });

        // Task fields
        UNIFIED_CSV_HEADERS.filter(h => h.startsWith('task_')).forEach(header => {
          const taskHeader = header.replace('task_', '');
          if (taskHeader === 'responsibleIds') {
            rowData[header] = escapeCsvValue(task.responsibleIds ? task.responsibleIds.join(';') : '');
          } else if (taskHeader === 'completed') {
            rowData[header] = escapeCsvValue(task.completed ? 'true' : 'false');
          } else if (taskHeader === 'deadline') {
            const value = task.deadline;
            rowData[header] = value instanceof Timestamp ? value.toDate().toISOString() : '';
          } else {
            rowData[header] = escapeCsvValue(task[taskHeader as keyof Task]);
          }
        });
        rows.push(UNIFIED_CSV_HEADERS.map(h => rowData[h]).join(','));
      });
    });
  });

  return rows.join('\n');
}

export function csvToProjects(csvString: string): Project[] {
  const lines = csvString.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) {
    return []; // No data rows
  }

  const headers = lines[0].split(',').map(header => header.trim());
  const projectsMap = new Map<string, Project>();
  const sectionsMap = new Map<string, ProjectSection>();

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const rowData: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowData[header] = unescapeCsvValue(values[index] || '');
    });

    // Reconstruct Project
    const projectId = rowData['project_id'];
    if (projectId && !projectsMap.has(projectId)) {
      const project: Project = {
        id: projectId,
        clientId: rowData['project_clientId'],
        name: rowData['project_name'],
        scope: rowData['project_scope'],
        value: parseFloat(rowData['project_value']) || 0,
        cost: parseFloat(rowData['project_cost']) || 0,
        status: rowData['project_status'] as Project['status'],
        deadline: rowData['project_deadline'] ? Timestamp.fromDate(new Date(rowData['project_deadline'])) : undefined,
        createdAt: rowData['project_createdAt'] ? Timestamp.fromDate(new Date(rowData['project_createdAt'])) : undefined,
        sections: []
      };
      projectsMap.set(projectId, project);
    }

    // Reconstruct Section
    const sectionId = rowData['section_id'];
    if (sectionId && projectId && projectsMap.has(projectId) && !sectionsMap.has(sectionId)) {
      const section: ProjectSection = {
        id: sectionId,
        title: rowData['section_title'],
        tasks: []
      };
      sectionsMap.set(sectionId, section);
      projectsMap.get(projectId)?.sections?.push(section);
    }

    // Reconstruct Task
    const taskId = rowData['task_id'];
    if (taskId && sectionId && sectionsMap.has(sectionId)) {
      const task: Task = {
        id: taskId,
        text: rowData['task_text'],
        parentId: rowData['task_parentId'] || undefined,
        description: rowData['task_description'] || undefined,
        responsibleIds: rowData['task_responsibleIds'] ? rowData['task_responsibleIds'].split(';') : [],
        completed: rowData['task_completed'] === 'true',
        priority: rowData['task_priority'] as Task['priority'] || 'Baixa',
        deadline: rowData['task_deadline'] ? Timestamp.fromDate(new Date(rowData['task_deadline'])) : undefined,
        timeLogs: [] // Assuming timeLogs are not part of CSV for now
      };
      sectionsMap.get(sectionId)?.tasks.push(task);
    }
  }

  return Array.from(projectsMap.values());
}
