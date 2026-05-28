package com.campusblindbox.message.repository;

import com.campusblindbox.message.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    Page<Message> findByUserIdOrderByCreateTimeDesc(Long userId, Pageable pageable);

    Page<Message> findByUserIdAndStatusOrderByCreateTimeDesc(Long userId, String status, Pageable pageable);

    Page<Message> findByUserIdAndTypeOrderByCreateTimeDesc(Long userId, String type, Pageable pageable);

    long countByUserIdAndStatus(Long userId, String status);
}
