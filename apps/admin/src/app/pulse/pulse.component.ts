import { Component, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-pulse',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pulse.component.html',
  styleUrls: ['./pulse.component.scss']
})
export class PulseComponent {
  @HostBinding('attr.data-theme') theme = 'dark';
  reasoningEntries = [
    {
      title: 'Analyzing Floor Load...',
      time: '09:42:12 - High throughput detected in Terrace West',
      detail: 'Executing staff rotation optimization...',
      active: true
    },
    {
      title: 'Predictive Logic',
      time: 'T12 reservation overlap imminent',
      detail: 'Applying buffer window +15m',
      active: false
    },
    {
      title: 'Inventory Check',
      time: 'Node Alpha: Beverage level 12%',
      detail: 'Autostock triggered',
      active: false
    },
    {
      title: 'System Diagnostic',
      time: 'Core thermal: 42°C (Stable)',
      detail: 'Sync latency: 0.04ms',
      active: false
    }
  ];

  planManifest = [
    { label: 'Sync Table 4 Status', completed: true },
    { label: 'Rebalance Inventory Nodes', completed: false },
    { label: 'Notify Floor Manager', completed: false },
    { label: 'Update Peak Projections', completed: false }
  ];
}
