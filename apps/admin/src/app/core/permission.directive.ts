import {
  Directive,
  effect,
  inject,
  Input,
  signal,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { PermissionService } from './permission.service';

@Directive({
  selector: '[appPermission]',
  standalone: true,
})
export class PermissionDirective {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private permissionService = inject(PermissionService);

  private code = signal('');
  private rendered = false;

  @Input({ required: true })
  set appPermission(value: string) {
    this.code.set(value);
  }

  constructor() {
    effect(() => {
      const code = this.code();
      const allowed = code ? this.permissionService.hasPermission(code) : false;
      if (allowed && !this.rendered) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.rendered = true;
      } else if (!allowed && this.rendered) {
        this.viewContainer.clear();
        this.rendered = false;
      }
    });
  }
}