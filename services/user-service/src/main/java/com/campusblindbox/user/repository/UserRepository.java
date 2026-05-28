package com.campusblindbox.user.repository;

import com.campusblindbox.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByOpenid(String openid);

    boolean existsByOpenid(String openid);

    List<User> findByRole(User.Role role);

    List<User> findByStatus(User.Status status);

    List<User> findByRoleAndStatus(User.Role role, User.Status status);

    Optional<User> findByIdAndStatus(Long id, User.Status status);
}
