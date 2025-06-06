package org.proj.authservice.controller;

import lombok.RequiredArgsConstructor;
import org.proj.authservice.service.JwtService;
import org.proj.authservice.service.UserServiceClient;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


@RequiredArgsConstructor
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final JwtService jwtService;
    private final UserServiceClient userServiceClient;

    @GetMapping(value = "/login/success", produces = MediaType.TEXT_HTML_VALUE)
    public String handleLogin(@AuthenticationPrincipal OAuth2User user) {
        String email = user.getAttribute("email");
        Long userId = userServiceClient.findOrCreateUser(email);

        String token = jwtService.generateToken(userId);

        String htmlResponse = "<html>\n" +
                "  <body>\n" +
                "    <script>\n" +
                "      window.opener.postMessage({ token: '" + token + "' }, 'http://localhost:4200');\n" +
                "      window.close();\n" +
                "    </script>\n" +
                "  </body>\n" +
                "</html>";

        return htmlResponse;
    }

}