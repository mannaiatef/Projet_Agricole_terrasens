import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { FieldsListComponent } from './fields-list.component';
import { FieldDetailComponent } from './field-detail.component';
import { FieldFormComponent } from './field-form.component';

const routes: Routes = [
  {
    path: '',
    component: FieldsListComponent,
  },
  {
    path: 'create',
    component: FieldFormComponent,
  },
  {
    path: ':id',
    component: FieldDetailComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FieldsRoutingModule {}
