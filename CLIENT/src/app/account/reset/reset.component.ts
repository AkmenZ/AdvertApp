import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import { AccountService } from '../account.service';

@Component({
  selector: 'app-reset',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.css']
})
export class ResetComponent implements OnInit {
  public token = this.router.url.split('/').pop();
  resetForm: FormGroup;
  passwordPatern = "(?=^.{6,50}$)(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\\s).*$";
  faInfoCircle = faInfoCircle;//Icon
  showAlert = false;

  constructor(private router: Router, public accountService: AccountService, private fb: FormBuilder) { }

  ngOnInit(): void {
      //console.log(this.token);
      this.initializeForm();
  }

  initializeForm() {
    this.resetForm = new FormGroup({
      resetToken: new FormControl(''),
      password: new FormControl('', [Validators.required, Validators.pattern(this.passwordPatern)]),
      confirmPassword: new FormControl('', [Validators.required, this.matchValues('password')])
    })

    this.resetForm.patchValue({
      resetToken: this.token
    })

    this.resetForm.controls.password.valueChanges.subscribe(() => {
      this.resetForm.controls.confirmPassword.updateValueAndValidity();
    })
  }

  matchValues(matchTo: string): ValidatorFn {
    return (control: AbstractControl) => {
      return control?.value === control?.parent?.controls[matchTo].value ? null : {isMatching: true}
    }
  }

  resetPassword() {
    console.log(this.resetForm.value)
    this.accountService.resetPassword(this.resetForm.value).subscribe({
      next: response => console.log(response),
      error: error => console.log(error)
    })
  }

  onSubmit() {
    this.router.navigateByUrl('/');
  }

}
