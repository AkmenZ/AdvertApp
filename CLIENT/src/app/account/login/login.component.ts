import { Component, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { AccountService } from 'src/app/account/account.service';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';

import { ForgotComponent } from '../forgot/forgot.component';
import { RegisterComponent } from '../register/register.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;

  constructor(private accountService: AccountService, private modalService: BsModalService, public modalRef: BsModalRef,
              private toastr: ToastrService) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  login() {
    this.accountService.login(this.loginForm.value).subscribe({
      next: response => console.log(response),
      error: error => {console.log(error); this.toastr.error(this.toastrErrorMessage())},
      complete: () => this.modalService.hide()
    });
  }

  initializeForm() {
    this.loginForm = new FormGroup({
      email: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required)
    })
  }

  closeModal() {
    this.modalService.hide()
  }

  openRegisterModal() {
    this.modalService.show(RegisterComponent)
  }

  openForgotModal() {
    this.modalService.show(ForgotComponent)
  }

  //Login failed
  toastrErrorMessage(){
    const language = localStorage.getItem('myLang')
      if(language == 'gb') return ('Inalid Email and/or Password!')
      else if(language == 'ru') return ('Неправильная Эл. адрес или Пароль!')
      else return ('Nepareizs Epasts un/vai Parole!')
  }
 
}

