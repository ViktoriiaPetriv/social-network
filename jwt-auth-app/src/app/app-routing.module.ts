import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ChatComponent } from './components/chat/chat.component';
import { CallbackComponent } from './components/callback/callback.component';
import { AuthGuard } from './guards/auth.guard';
import { ProfileSetupGuard } from "./guards/profile.guard";
import {ProfileSetupComponent} from "./components/profile.component";
import {UserProfileComponent} from "./components/user-profile.component";
import {ChatPageComponent} from "./components/chat-page.component";

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'profile-setup', component:  ProfileSetupComponent, canActivate: [ProfileSetupGuard]},
  { path: 'chat', component: ChatComponent, canActivate: [AuthGuard] },
  { path: 'callback', component: CallbackComponent },
  {path: 'users/:id', component: UserProfileComponent},
  { path: 'chat/:chatId', component: ChatPageComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
