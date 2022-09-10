import { Component, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { AccountService } from '../account.service';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { RegisterComponent } from '../register/register.component';

@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.css']
})
export class ForgotComponent implements OnInit {
  forgotForm: FormGroup;

  constructor(public accountService: AccountService, private modalService: BsModalService, 
              public modalRef: BsModalRef, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  forgotPassword() {
    this.accountService.forgotPassword(this.forgotForm.value['email'])
    .subscribe({
      next: response => console.log(response),
      error: error => {console.log(error); this.toastr.error(this.toastrErrorMessage())},
      complete: () => {this.modalService.hide(); this.toastr.success(this.toastrSuccessMessage())}
    })
  }

  initializeForm() {
    this.forgotForm = new FormGroup({
      email: new FormControl('', Validators.required)
    })
  }

  closeModal() {
    this.modalService.hide()
  }

  openRegisterModal() {
    this.modalService.show(RegisterComponent)
  }

  //Request failed
  toastrErrorMessage(){
    const language = localStorage.getItem('myLang')
      if(language == 'gb') return ('User not found!')
      else if(language == 'ru') return ('Пользователь не найден!')
      else return ('Lietotājs nav atrasts!')
  }

  //Request successful
  toastrSuccessMessage(){
    const language = localStorage.getItem('myLang')
      if(language == 'gb') return ('Request is sent!')
      else if(language == 'ru') return ('Запрос отправлен!')
      else return ('Pieprasijums izsūtīts!')
  }

}
