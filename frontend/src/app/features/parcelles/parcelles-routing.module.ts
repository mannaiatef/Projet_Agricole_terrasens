import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ParcellesComponent } from './parcelles.component';

const routes: Routes = [
  {
    path: '',
    component: ParcellesComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ParcellesRoutingModule {}
