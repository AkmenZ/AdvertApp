import { Component, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { AccountService } from '../account.service';
import { ToastrService } from 'ngx-toastr';

import { LoginComponent } from '../login/login.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  passwordPatern = "(?=^.{6,50}$)(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\\s).*$";

  constructor(public accountService: AccountService, private modalService: BsModalService, public modalRef: BsModalRef, 
              private toastr: ToastrService) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  register() {
    this.accountService.register(this.registerForm.value).subscribe({
      next: response => console.log(response),
      error: error => {console.log(error); this.toastr.error(this.toastrErrorMessage())},
      complete: () => {this.modalService.hide(); this.toastr.success(this.toastrSuccessMessage())}
    })
  }

  initializeForm() {
    this.registerForm = new FormGroup({
      displayName: new FormControl('', Validators.required),
      email: new FormControl('', Validators.required),
      password: new FormControl('', [Validators.required, Validators.pattern(this.passwordPatern)]),
      confirmPassword: new FormControl('', [Validators.required, this.matchValues('password')])
    })

    this.registerForm.controls.password.valueChanges.subscribe(() => {
      this.registerForm.controls.confirmPassword.updateValueAndValidity();
    })
  }

  matchValues(matchTo: string): ValidatorFn {
    return (control: AbstractControl) => {
      return control?.value === control?.parent?.controls[matchTo].value ? null : {isMatching: true}
    }
  }

  closeModal() {
    this.modalService.hide()
  }

  openLoginModal() {
    this.modalService.show(LoginComponent)
  }

  //Registration successful
  toastrSuccessMessage(){
    const language = localStorage.getItem('myLang')
      if(language == 'gb') return ('Thank you! Confirmation email sent')
      else if(language == 'ru') return ('Спасибо! Письмо с подтверждением отправлено!')
      else return ('Paldies! Apstiprinājuma epasts izsūtīts')
  }

  //Registration failed
  toastrErrorMessage(){
    const language = localStorage.getItem('myLang')
      if(language == 'gb') return ('Email already registered!')
      else if(language == 'ru') return ('Электронная почта уже зарегистрирована!')
      else return ('Šāds epasts jau ir reģistrēts!')
  }

}
