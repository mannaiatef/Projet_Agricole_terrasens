import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CropCalendarComponent } from './crop-calendar.component';

const routes: Routes = [
  {
    path: '',
    component: CropCalendarComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CalendarRoutingModule { }
