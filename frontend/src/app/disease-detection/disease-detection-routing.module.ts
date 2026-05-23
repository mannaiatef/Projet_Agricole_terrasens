import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DiseaseUploadComponent } from './components/disease-upload.component';
import { DiseaseHistoryComponent } from './components/disease-history.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'upload',
        component: DiseaseUploadComponent
      },
      {
        path: 'history',
        component: DiseaseHistoryComponent
      },
      {
        path: '',
        redirectTo: 'upload',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DiseaseDetectionRoutingModule { }
