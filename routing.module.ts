import { Routes } from '@angular/router';
import { AuthGuard } from 'src/app/guards/app.guard';

export const APPROVALRoutes: Routes = [
    
    { path: 'request', loadChildren: () => import('./request/request.module').then(m => m.RequestPageModule), canActivate: [AuthGuard] },
    { path: 'request/:id', loadChildren: () => import('./request-detail/request-detail.module').then(m => m.RequestDetailPageModule), canActivate: [AuthGuard] },

    { path: 'approval-rule', loadChildren: () => import('./approval-rule/approval-rule.module').then(m => m.ApprovalRulePageModule), canActivate: [AuthGuard] },
    { path: 'approval-rule/:id', loadChildren: () => import('./approval-rule-detail/approval-rule-detail.module').then(m => m.ApprovalRuleDetailPageModule), canActivate: [AuthGuard] },
  
    { path: 'approval-template', loadChildren: () => import('./approval-template/approval-template.module').then(m => m.ApprovalTemplatePageModule), canActivate: [AuthGuard] },
    { path: 'approval-template/:id', loadChildren: () => import('./approval-template-detail/approval-template-detail.module').then(m => m.ApprovalTemplateDetailPageModule), canActivate: [AuthGuard] },
  
];
