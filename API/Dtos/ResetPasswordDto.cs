using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace API.Dtos
{
    public class ResetPasswordDto
    {
        [Required]
        public string ResetToken { get; set; } = string.Empty;

        [Required]
        [RegularExpression("(?=^.{6,10}$)(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\\s).*$",
                        ErrorMessage = "Password must have 1 uppercase, 1 lowercase, 1 number and be atleast 6 characters long!")]
        public string Password { get; set; } = string.Empty;

        [Required, Compare("Password", ErrorMessage = "The password and confirmation password do not match.")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}