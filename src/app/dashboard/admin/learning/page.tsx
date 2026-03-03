"use client";

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { TrainingModule } from '@/types';
import ModuleForm from '@/components/admin/ModuleForm';

export default function AdminLearningPage() {
  const { trainingModules, addTrainingModule, updateTrainingModule, deleteTrainingModule } = useData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModule | undefined>(undefined);

  const handleCreate = () => {
    setEditingModule(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (module: TrainingModule) => {
    setEditingModule(module);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this module? This will also remove it from users\' assigned trainings.')) {
      deleteTrainingModule(id);
    }
  };

  const handleSubmit = (data: Omit<TrainingModule, 'id'>) => {
    if (editingModule) {
      updateTrainingModule(editingModule.id, data);
    } else {
      addTrainingModule(data);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manage Learning Modules</h1>
          <p className="text-slate-500 mt-2">Create and edit training content for employees.</p>
        </div>
        {!isFormOpen && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium shadow-sm"
          >
            + Create New Module
          </button>
        )}
      </header>

      {isFormOpen ? (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            {editingModule ? 'Edit Module' : 'Create New Module'}
          </h2>
          <ModuleForm
            initialData={editingModule}
            onSubmit={handleSubmit}
            onCancel={() => setIsFormOpen(false)}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Module
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Target Depts
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {trainingModules.map((module) => (
                  <tr key={module.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">{module.title}</span>
                        <span className="text-sm text-slate-500">{module.duration}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        module.type === 'Video' ? 'bg-blue-100 text-blue-800' :
                        module.type === 'Document' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {module.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {module.targetDepartments.map(dept => (
                          <span key={dept} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">
                            {dept}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {module.required ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Required
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                          Optional
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(module)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(module.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {trainingModules.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No training modules found. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
