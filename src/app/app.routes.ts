import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { QuestionnaireListComponent } from './questionnaire-list/questionnaire-list.component';
import { QuestionnaireEditorComponent } from './questionnaire-editor/questionnaire-editor.component';
import { QuestionnaireFillComponent } from './questionnaire-fill/questionnaire-fill.component';
import { QuestionnaireResultsComponent } from './questionnaire-results/questionnaire-results.component';
import { QuestionnaireBackendComponent } from './questionnaire-backend/questionnaire-backend.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { MemberInfoComponent } from './member-info/member-info.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'member', component: MemberInfoComponent },
  { path: 'backend', component: QuestionnaireBackendComponent },
  { path: 'questionnaires', component: QuestionnaireListComponent },
  { path: 'create', component: QuestionnaireEditorComponent, canActivate: [authGuard] },
  { path: 'edit/:id', component: QuestionnaireEditorComponent, canActivate: [authGuard] },
  { path: 'fill/:id', component: QuestionnaireFillComponent },
  { path: 'results/:id', component: QuestionnaireResultsComponent },
  { path: '**', redirectTo: '' }
];
