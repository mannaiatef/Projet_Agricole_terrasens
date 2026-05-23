import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ParcellesRoutingModule } from './parcelles-routing.module';
import { ParcellesComponent } from './parcelles.component';

@NgModule({
  declarations: [ParcellesComponent],
  imports: [CommonModule, FormsModule, ParcellesRoutingModule],
})
export class ParcellesModule {}
